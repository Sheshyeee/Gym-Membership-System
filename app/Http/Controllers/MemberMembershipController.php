<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\PaymentService;
use App\Services\PricingService;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use RuntimeException;

class MemberMembershipController extends Controller
{
    public function __construct(
        protected PaymentService $payments,
        protected PricingService $pricing,
    ) {}

    /**
     * The membership page: current plan + the list of plans to switch/renew into.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $current = $user->activeSubscription()->with('plan')->first();

        $plans = Plan::where('is_active', true)->orderBy('sort_order')->get();

        return Inertia::render('member/membership', [
            'currentSubscription' => $current ? [
                'plan_id' => $current->plan_id,
                'plan_name' => $current->plan->name,
                'plan_slug' => $current->plan->slug,
                'billing_cycle' => $current->billing_cycle,
                'status' => $current->status,
                'started_at' => $current->current_period_start?->format('F j, Y'),
                'valid_until' => $current->current_period_end?->format('F j, Y'),
                'days_remaining' => $current->current_period_end?->isFuture()
                    ? (int) now()->diffInDays($current->current_period_end)
                    : 0,
                'percent_used' => $this->percentUsed($current),
            ] : null,
            'plans' => $plans->map(fn(Plan $plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'tagline' => $plan->tagline,
                'highlighted' => $plan->highlighted,
                'pricing' => $this->pricing->breakdown($plan),
            ]),
        ]);
    }

    /**
     * GET checkout page (Image 1) for a chosen plan + billing cycle.
     * Works out for itself whether this is a renewal or a switch — the
     * frontend just says which plan/cycle was picked.
     */
    public function checkout(Request $request)
    {
        $user = $request->user();
        $current = $user->activeSubscription;

        $data = $request->validate([
            'plan_id' => ['required', Rule::exists('plans', 'id')->where('is_active', true)],
            'billing_cycle' => ['required', 'in:monthly,annual'],
        ]);

        $plan = Plan::findOrFail($data['plan_id']);

        if (! $current) {
            abort(403, 'No active subscription to renew or switch.');
        }

        $isRenewal = $current->plan_id === $plan->id && $current->billing_cycle === $data['billing_cycle'];

        $amount = $this->pricing->amountDueToday($plan, $data['billing_cycle']);

        return Inertia::render('member/membership-checkout', [
            'action' => $isRenewal ? 'renew' : 'switch',
            'plan' => [
                'id' => $plan->id,
                'name' => $plan->name,
                'billing_cycle' => $data['billing_cycle'],
            ],
            'amount' => $amount,
            'billingEmail' => $user->email,
            'billingName' => $user->name,
        ]);
    }

    /**
     * POST from the checkout page: actually creates the invoice (+ new
     * subscription row, if this is a switch) and sends the user to
     * GCash/Maya to approve payment.
     */
    public function pay(Request $request)
    {
        $user = $request->user();
        $current = $user->activeSubscription;

        $data = $request->validate([
            'plan_id' => ['required', Rule::exists('plans', 'id')->where('is_active', true)],
            'billing_cycle' => ['required', 'in:monthly,annual'],
            'payment_method_type' => ['required', 'in:gcash,paymaya'],
        ]);

        if (! $current) {
            abort(403, 'No active subscription to renew or switch.');
        }

        $plan = Plan::findOrFail($data['plan_id']);

        // Trust the server's own comparison, not whatever the frontend
        // labeled the button — if it resolves to the same plan+cycle the
        // user is already on, this is a renewal no matter what was sent.
        $isRenewal = $current->plan_id === $plan->id && $current->billing_cycle === $data['billing_cycle'];

        // Same per-user lock pattern as onboarding: stops a double-click or
        // two tabs from minting two invoices (and two live charges) at once.
        $lock = Cache::lock("member-plan-change:{$user->id}", 10);

        try {
            $lock->block(5);
        } catch (LockTimeoutException) {
            return back()->withErrors(['payment' => 'Your previous request is still processing. Please wait a moment and try again.']);
        }

        try {
            [$subscription, $invoice] = $isRenewal
                ? $this->prepareRenewalInvoice($current, $data['payment_method_type'])
                : $this->prepareSwitchInvoice($user, $current, $plan, $data['billing_cycle'], $data['payment_method_type']);

            try {
                return $this->handleWalletPayment($invoice, $data['payment_method_type'], $invoice->amount);
            } catch (RuntimeException $e) {
                $invoice->update(['status' => 'failed']);

                return back()->withErrors(['payment' => $e->getMessage()]);
            }
        } finally {
            $lock->release();
        }
    }

    /**
     * Renewal: same plan, same active Subscription row — just a new invoice
     * against it. Nothing about the subscription changes until it's paid.
     */
    protected function prepareRenewalInvoice(Subscription $subscription, string $method): array
    {
        $invoice = $subscription->invoices()
            ->where('status', 'pending')
            ->latest()
            ->first();

        if ($invoice && $invoice->payment_method_type !== $method) {
            $invoice->update([
                'payment_method_type' => $method,
                'processor_source_id' => null,
                'processor_payment_intent_id' => null,
            ]);
        }

        if (! $invoice) {
            $amount = $this->pricing->amountDueToday($subscription->plan, $subscription->billing_cycle);

            $invoice = $subscription->invoices()->create([
                'user_id' => $subscription->user_id,
                'plan_id' => $subscription->plan_id,
                'amount' => $amount,
                'currency' => 'PHP',
                'payment_method_type' => $method,
                'status' => 'pending',
                'due_at' => now(),
            ]);
        }

        return [$subscription, $invoice];
    }

    /**
     * Switch: a brand new (pending) Subscription row for the target plan,
     * with the days remaining on the current plan snapshotted right now so
     * the credit can't drift while the user sits on the checkout page.
     */
    protected function prepareSwitchInvoice($user, Subscription $current, Plan $newPlan, string $billingCycle, string $method): array
    {
        $subscription = $user->subscriptions()
            ->where('plan_id', $newPlan->id)
            ->where('billing_cycle', $billingCycle)
            ->where('status', 'pending')
            ->latest()
            ->first();

        $invoice = $subscription
            ?->invoices()
            ->where('status', 'pending')
            ->latest()
            ->first();

        if ($invoice && $invoice->payment_method_type !== $method) {
            $invoice->update([
                'payment_method_type' => $method,
                'processor_source_id' => null,
                'processor_payment_intent_id' => null,
            ]);
        }

        if (! $subscription || ! $invoice) {
            $remainingDays = ($current->current_period_end && $current->current_period_end->isFuture())
                ? (int) now()->diffInDays($current->current_period_end)
                : 0;

            $amount = $this->pricing->amountDueToday($newPlan, $billingCycle);

            [$subscription, $invoice] = DB::transaction(function () use ($user, $newPlan, $billingCycle, $amount, $method, $remainingDays) {
                $subscription = $user->subscriptions()->create([
                    'plan_id' => $newPlan->id,
                    'billing_cycle' => $billingCycle,
                    'status' => 'pending',
                    'remaining_days_credit' => $remainingDays,
                ]);

                $invoice = $subscription->invoices()->create([
                    'user_id' => $user->id,
                    'plan_id' => $newPlan->id,
                    'amount' => $amount,
                    'currency' => 'PHP',
                    'payment_method_type' => $method,
                    'status' => 'pending',
                    'due_at' => now(),
                ]);

                return [$subscription, $invoice];
            });
        }

        return [$subscription, $invoice];
    }

    /**
     * Same shape as OnboardingController::handleWalletPayment — reuses an
     * existing not-yet-consumed source on retry instead of minting a new one.
     */
    protected function handleWalletPayment(Invoice $invoice, string $type, int $amount)
    {
        if ($invoice->processor_source_id) {
            $existing = $this->payments->retrieveSource($invoice->processor_source_id);
            $status = $existing['attributes']['status'] ?? null;

            if (in_array($status, ['pending', 'chargeable'], true)) {
                $checkoutUrl = $existing['attributes']['redirect']['checkout_url'] ?? null;

                if ($checkoutUrl) {
                    return Inertia::location($checkoutUrl);
                }
            }
        }

        $source = $this->payments->createSource(
            amount: $amount,
            type: $type,
            redirectSuccessUrl: route('member.membership.payment.return', ['invoice' => $invoice->id]),
            redirectFailedUrl: route('member.membership.payment.return', ['invoice' => $invoice->id, 'failed' => 1]),
            idempotencyKey: "member-source-create-{$invoice->id}",
        );

        $invoice->update(['processor_source_id' => $source['id']]);

        return Inertia::location($source['attributes']['redirect']['checkout_url']);
    }

    /**
     * Where GCash/Maya send the user back to. Doesn't confirm anything
     * itself — just shows a "processing" screen while the webhook does
     * the actual confirming.
     */
    public function paymentReturn(Request $request, Invoice $invoice)
    {
        if ($invoice->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($request->boolean('failed')) {
            $invoice->update(['status' => 'failed']);

            return redirect()->route('member.membership')
                ->withErrors(['payment' => 'Payment was not completed.']);
        }

        return Inertia::render('member/membership-payment-pending', [
            'invoice_id' => $invoice->id,
        ]);
    }

    public function invoiceStatus(Request $request, Invoice $invoice)
    {
        if ($invoice->user_id !== $request->user()->id) {
            abort(403);
        }

        $isPaid = $invoice->status === 'paid'
            || $invoice->subscription?->status === 'active';

        return response()->json([
            'status' => $isPaid ? 'paid' : $invoice->status,
        ]);
    }

    private function percentUsed(Subscription $sub): int
    {
        if (! $sub->current_period_start || ! $sub->current_period_end) {
            return 0;
        }

        $total = $sub->current_period_start->diffInSeconds($sub->current_period_end);

        if ($total <= 0) {
            return 100;
        }

        $elapsed = $sub->current_period_start->diffInSeconds(now());

        return (int) min(100, max(0, round($elapsed / $total * 100)));
    }
}
