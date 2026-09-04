<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymongoWebhookController extends Controller
{
    public function __construct(protected PaymentService $payments) {}

    public function handle(Request $request)
    {
        if (! $this->verifySignature($request)) {
            Log::warning('PayMongo webhook signature verification failed');
            return response()->json(['message' => 'Invalid signature'], Response::HTTP_UNAUTHORIZED);
        }

        $payload = $request->json()->all();
        $event = $payload['data'] ?? null;
        $eventId = $event['id'] ?? null;
        $eventType = $event['attributes']['type'] ?? null;

        if (! $eventId || ! $eventType) {
            return response()->json(['message' => 'Malformed payload'], Response::HTTP_BAD_REQUEST);
        }

        // Idempotency: if we've already processed this exact event, ack and stop.
        $isNew = DB::table('processed_webhook_events')->insertOrIgnore([
            'event_id' => $eventId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if (! $isNew) {
            return response()->json(['message' => 'Already processed']);
        }

        $resource = $event['attributes']['data'] ?? null;

        try {
            match ($eventType) {
                'source.chargeable' => $this->handleSourceChargeable($resource),
                'payment.paid' => $this->handlePaymentPaid($resource),
                'payment.failed' => $this->handlePaymentFailed($resource),
                default => Log::info('Unhandled PayMongo webhook event', ['type' => $eventType]),
            };
        } catch (\Throwable $e) {
            // Un-mark so PayMongo's retry can actually reprocess this event
            // instead of us silently swallowing it forever.
            DB::table('processed_webhook_events')->where('event_id', $eventId)->delete();

            Log::error('PayMongo webhook handler threw', [
                'event_id' => $eventId,
                'event_type' => $eventType,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Processing error'], 500);
        }

        return response()->json(['message' => 'ok']);
    }

    protected function handleSourceChargeable(?array $resource): void
    {
        $sourceId = $resource['id'] ?? null;
        if (! $sourceId) {
            return;
        }

        $invoice = Invoice::where('processor_source_id', $sourceId)->first();
        if (! $invoice || $invoice->status !== 'pending') {
            return;
        }

        try {
            $this->payments->createPaymentFromSource(
                $sourceId,
                $invoice->amount,
                idempotencyKey: "payment-create-{$invoice->id}",
            );
            // Don't mark paid here — wait for the payment.paid event, which
            // carries the actual Payment ID and is the true source of truth.
        } catch (\Throwable $e) {
            Log::error('Failed to charge chargeable source', ['invoice_id' => $invoice->id, 'error' => $e->getMessage()]);
            $invoice->update(['status' => 'failed']);
        }
    }

    protected function handlePaymentPaid(?array $resource): void
    {
        $sourceId = $resource['attributes']['source']['id'] ?? null;
        $paymentIntentId = $resource['attributes']['payment_intent_id'] ?? null;

        $invoice = match (true) {
            $sourceId !== null => Invoice::where('processor_source_id', $sourceId)->first(),
            $paymentIntentId !== null => Invoice::where('processor_payment_intent_id', $paymentIntentId)->first(),
            default => null,
        };

        if (! $invoice) {
            Log::warning('payment.paid webhook with no matching invoice', [
                'source_id' => $sourceId,
                'payment_intent_id' => $paymentIntentId,
            ]);
            return;
        }

        DB::transaction(function () use ($invoice, $resource) {
            $invoice->update([
                'status' => 'paid',
                'processor_payment_id' => $resource['id'] ?? null,
                'paid_at' => now(),
            ]);

            $subscription = $invoice->subscription; // relies on Invoice::subscription()

            if (! $subscription) {
                Log::error('Paid invoice has no subscription', ['invoice_id' => $invoice->id]);
                return;
            }

            $periodEnd = $subscription->billing_cycle === 'annual'
                ? now()->addYear()
                : now()->addMonth();

            $subscription->update([
                'status' => 'active',
                'current_period_start' => now(),
                'current_period_end' => $periodEnd,
                'next_billing_at' => $periodEnd,
            ]);
        });
    }

    protected function handlePaymentFailed(?array $resource): void
    {
        $sourceId = $resource['attributes']['source']['id'] ?? null;
        if (! $sourceId) {
            return;
        }

        $invoice = Invoice::where('processor_source_id', $sourceId)->first();
        $invoice?->update(['status' => 'failed']);
    }

    protected function verifySignature(Request $request): bool
    {
        $signatureHeader = $request->header('Paymongo-Signature');
        $secret = config('services.paymongo.webhook_secret');

        if (! $signatureHeader || ! $secret) {
            Log::warning('PayMongo webhook missing signature header or secret configured');
            return false;
        }

        // Header format: t=timestamp,te=test_signature,li=live_signature
        $parts = collect(explode(',', $signatureHeader))
            ->mapWithKeys(function ($part) {
                [$key, $value] = array_pad(explode('=', $part, 2), 2, null);
                return [$key => $value];
            });

        $timestamp = $parts->get('t');

        // Pick the signature that matches how the secret key is configured, not
        // hardcoded to test mode. PayMongo secret keys are prefixed sk_test_ / sk_live_
        // (and webhook secrets whsec_test_ / whsec_live_ depending on dashboard mode);
        // use whichever your config denotes as the active mode.
        $isLiveMode = config('services.paymongo.mode', 'test') === 'live';
        $signatureKey = $isLiveMode ? 'li' : 'te';
        $expectedSignature = $parts->get($signatureKey);

        if (! $timestamp || ! $expectedSignature) {
            Log::warning('PayMongo webhook signature header malformed', [
                'has_timestamp' => (bool) $timestamp,
                'mode' => $isLiveMode ? 'live' : 'test',
            ]);
            return false;
        }

        $signedPayload = $timestamp . '.' . $request->getContent();
        $computedSignature = hash_hmac('sha256', $signedPayload, $secret);

        return hash_equals($expectedSignature, $computedSignature);
    }
}
