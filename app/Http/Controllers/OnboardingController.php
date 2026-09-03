<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Plan;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use RuntimeException;

class OnboardingController extends Controller
{
    public function __construct(protected PaymentService $payments) {}

    public function index()
    {
        return Inertia::render('onboarding/index', [
            'plans' => Plan::where('is_active', true)->get(),
        ]);
    }

    public function skip(Request $request)
    {
        $request->user()->update(['onboarding_skipped_at' => now()]);

        return redirect()->route('dashboard');
    }

    public function complete(Request $request)
    {
        $data = $request->validate([
            'plan_id' => ['required', 'exists:plans,id'],
            'billing_cycle' => ['required', 'in:monthly,annual'],
            'payment_method_type' => ['required', 'in:gcash,paymaya,card'],
        ]);

        $plan = Plan::findOrFail($data['plan_id']);
        $user = $request->user();

        $amount = $data['billing_cycle'] === 'annual'
            ? (int) round(($plan->annual_price ?? $plan->monthly_price * 12))
            : $plan->monthly_price;

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
        $source = $this->payments->createSource(
            amount: $amount,
            type: $type,
            redirectSuccessUrl: route('onboarding.payment.return', ['invoice' => $invoice->id]),
            redirectFailedUrl: route('onboarding.payment.return', ['invoice' => $invoice->id, 'failed' => 1]),
        );

        $invoice->update(['processor_source_id' => $source['id']]);

        $checkoutUrl = $source['attributes']['redirect']['checkout_url'];

        // Cross-domain redirect (to GCash/Maya's own site) needs a full browser
        // navigation, not an Inertia XHR visit.
        return Inertia::location($checkoutUrl);
    }

    protected function handleCardPayment(Invoice $invoice, int $amount)
    {
        $intent = $this->payments->createPaymentIntent($amount);

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

    /**
     * Where GCash/Maya redirect the user back to after they approve/decline.
     * This does NOT confirm payment — the webhook does that. This just shows
     * the user a "processing" screen while we wait for the webhook.
     */
    public function paymentReturn(Request $request, Invoice $invoice)
    {
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
