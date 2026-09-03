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

        match ($eventType) {
            'source.chargeable' => $this->handleSourceChargeable($resource),
            'payment.paid' => $this->handlePaymentPaid($resource),
            'payment.failed' => $this->handlePaymentFailed($resource),
            default => Log::info('Unhandled PayMongo webhook event', ['type' => $eventType]),
        };

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
            $this->payments->createPaymentFromSource($sourceId, $invoice->amount);
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
        if (! $sourceId) {
            return;
        }

        $invoice = Invoice::where('processor_source_id', $sourceId)->first();
        if (! $invoice) {
            Log::warning('payment.paid webhook with no matching invoice', ['source_id' => $sourceId]);
            return;
        }

        DB::transaction(function () use ($invoice, $resource) {
            $invoice->update([
                'status' => 'paid',
                'processor_payment_id' => $resource['id'] ?? null,
                'paid_at' => now(),
            ]);

            $subscription = $invoice->subscription;
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
        Log::info('Webhook debug', [
            'header' => $request->header('Paymongo-Signature'),
            'secret_present' => (bool) config('services.paymongo.webhook_secret'),
            'secret_last4' => substr((string) config('services.paymongo.webhook_secret'), -4),
        ]);
        $signatureHeader = $request->header('Paymongo-Signature');
        $secret = config('services.paymongo.webhook_secret');

        if (! $signatureHeader || ! $secret) {
            return false;
        }

        // Header format: t=timestamp,te=test_signature,li=live_signature
        $parts = collect(explode(',', $signatureHeader))
            ->mapWithKeys(function ($part) {
                [$key, $value] = explode('=', $part, 2);
                return [$key => $value];
            });

        $timestamp = $parts->get('t');
        $expectedSignature = $parts->get('te');

        if (! $timestamp || ! $expectedSignature) {
            return false;
        }

        $signedPayload = $timestamp . '.' . $request->getContent();
        $computedSignature = hash_hmac('sha256', $signedPayload, $secret);

        return hash_equals($expectedSignature, $computedSignature);
    }
}
