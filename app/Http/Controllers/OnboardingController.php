<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Plan;
use App\Services\PaymentService;
use App\Services\PricingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use RuntimeException;

class OnboardingController extends Controller
{
    public function __construct(
        protected PaymentService $payments,
        protected PricingService $pricing,
    ) {}

    public function index()
    {
        $plans = Plan::where('is_active', true)->get();

        return Inertia::render('onboarding/index', [
            'plans' => $plans->map(fn(Plan $plan) => [
                ...$plan->toArray(),
                'pricing' => $this->pricing->breakdown($plan),
            ]),
        ]);
    }

    public function skip(Request $request)
    {
        $request->user()->update(['onboarding_skipped_at' => now()]);

        return redirect()->route('dashboard');
    }

    public function complete(Request $request)
    {
        $user = $request->user();

        if ($user->hasActiveSubscription()) {
            return redirect()->route('dashboard');
        }

        $data = $request->validate([
            'plan_id' => [
                'required',
                Rule::exists('plans', 'id')->where('is_active', true),
            ],
            'billing_cycle' => ['required', 'in:monthly,annual'],
            'payment_method_type' => ['required', 'in:gcash,paymaya,card'],
        ]);

        $plan = Plan::findOrFail($data['plan_id']);

        // Reuse an existing pending subscription/invoice for this plan+cycle
        // instead of minting a new one on every submit. Without this, a user
        // who retries checkout (slow redirect, browser back, etc.) ends up
        // with multiple invoices — and if a LATER one is the one that gets
        // paid, the tab polling the FIRST invoice's status spins forever.
        $subscription = $user->subscriptions()
            ->where('plan_id', $plan->id)
            ->where('billing_cycle', $data['billing_cycle'])
            ->where('status', 'pending')
            ->latest()
            ->first();

        $invoice = $subscription
            ?->invoices()
            ->where('status', 'pending')
            ->latest()
            ->first();

        if (! $subscription || ! $invoice) {
            $amount = $this->pricing->amountDueToday($plan, $data['billing_cycle']);

            // Annual is charged as a lump sum, not divided into monthly amounts.
            // (Frontend shows a per-month equivalent, but the actual charge is the full period.)

            [$subscription, $invoice] = DB::transaction(function () use ($user, $plan, $data, $amount) {
                $subscription = $user->subscriptions()->create([
                    'plan_id' => $plan->id,
                    'billing_cycle' => $data['billing_cycle'],
                    'status' => 'pending', // becomes 'active' only once webhook confirms payment
                ]);

                $invoice = $subscription->invoices()->create([
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                    'amount' => $amount,
                    'currency' => 'PHP',
                    'payment_method_type' => $data['payment_method_type'],
                    'status' => 'pending',
                    'due_at' => now(),
                ]);

                return [$subscription, $invoice];
            });
        } elseif ($invoice->payment_method_type !== $data['payment_method_type']) {
            // They switched payment methods on retry (e.g. GCash -> Maya).
            // The old source/intent is stale and must not be reused.
            $invoice->update([
                'payment_method_type' => $data['payment_method_type'],
                'processor_source_id' => null,
                'processor_payment_intent_id' => null,
            ]);
        }

        $amount = $invoice->amount;

        try {
            if (in_array($data['payment_method_type'], ['gcash', 'paymaya'], true)) {
                return $this->handleWalletPayment($invoice, $data['payment_method_type'], $amount);
            }

            return $this->handleCardPayment($invoice, $amount);
        } catch (RuntimeException $e) {
            $invoice->update(['status' => 'failed']);

            return back()->withErrors(['payment' => $e->getMessage()]);
        }
    }

    protected function handleWalletPayment(Invoice $invoice, string $type, int $amount)
    {
        // If we already created a source for this invoice (e.g. a retry that
        // reused the pending invoice above, same method), don't mint a
        // second one — just send them back to the same checkout.
        if ($invoice->processor_source_id) {
            $existing = $this->payments->retrieveSource($invoice->processor_source_id);
            $status = $existing['attributes']['status'] ?? null;

            if (in_array($status, ['pending', 'chargeable'], true)) {
                $checkoutUrl = $existing['attributes']['redirect']['checkout_url'] ?? null;

                if ($checkoutUrl) {
                    return Inertia::location($checkoutUrl);
                }
            }
            // Otherwise (expired/failed/consumed) fall through and create a fresh one.
        }

        $source = $this->payments->createSource(
            amount: $amount,
            type: $type,
            redirectSuccessUrl: route('onboarding.payment.return', ['invoice' => $invoice->id]),
            redirectFailedUrl: route('onboarding.payment.return', ['invoice' => $invoice->id, 'failed' => 1]),
            idempotencyKey: "source-create-{$invoice->id}",
        );

        $invoice->update(['processor_source_id' => $source['id']]);

        $checkoutUrl = $source['attributes']['redirect']['checkout_url'];

        // Cross-domain redirect (to GCash/Maya's own site) needs a full browser
        // navigation, not an Inertia XHR visit.
        return Inertia::location($checkoutUrl);
    }

    protected function handleCardPayment(Invoice $invoice, int $amount)
    {
        $intent = $this->payments->createPaymentIntent(
            amount: $amount,
            idempotencyKey: "intent-create-{$invoice->id}",
        );

        $invoice->update(['processor_payment_intent_id' => $intent['id']]);

        // Hand the frontend what it needs to tokenize + confirm via PayMongo.js.
        return Inertia::render('onboarding/index', [
            'plans' => Plan::where('is_active', true)->get(),
            'cardPayment' => [
                'invoice_id' => $invoice->id,
                'client_key' => $intent['attributes']['client_key'],
                'public_key' => config('services.paymongo.public_key'),
            ],
        ]);
    }

    public function invoiceStatus(Invoice $invoice)
    {
        if ($invoice->user_id !== request()->user()->id) {
            abort(403);
        }

        $isPaid = $invoice->status === 'paid'
            || $invoice->subscription?->status === 'active';

        return response()->json([
            'status' => $isPaid ? 'paid' : $invoice->status,
        ]);
    }
    /**
     * Where GCash/Maya redirect the user back to after they approve/decline.
     * This does NOT confirm payment — the webhook does that. This just shows
     * the user a "processing" screen while we wait for the webhook.
     */

    public function paymentReturn(Request $request, Invoice $invoice)
    {
        if ($invoice->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($request->boolean('failed')) {
            $invoice->update(['status' => 'failed']);

            return redirect()->route('onboarding.index')
                ->withErrors(['payment' => 'Payment was not completed.']);
        }

        return Inertia::render('onboarding/payment-pending', [
            'invoice_id' => $invoice->id,
        ]);
    }
}
