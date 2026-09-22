<?php

namespace App\Http\Controllers;

use App\Events\InvoiceStatusUpdated;
use App\Events\PayoutStatusUpdated;
use App\Models\Invoice;
use App\Notifications\StaffNewSubscriptionCreated;
use App\Notifications\StaffPaymentFailed;
use App\Notifications\StaffPaymentRefunded;
use App\Services\PaymentService;
use App\Support\PayoutRecorder;
use App\Support\StaffAlert;
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
            if (str_starts_with((string) $eventType, 'payout.')) {
                $this->handlePayoutUpdated($resource);
            } else {
                match ($eventType) {
                    'source.chargeable' => $this->handleSourceChargeable($resource),
                    'payment.paid' => $this->handlePaymentPaid($resource),
                    'payment.refund.updated' => $this->handleRefundUpdated($resource),
                    'payment.failed' => $this->handlePaymentFailed($resource),
                    default => Log::info('Unhandled PayMongo webhook event', ['type' => $eventType]),
                };
            }
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

    protected function handlePayoutUpdated(?array $resource): void
    {
        if (! $resource) {
            return;
        }

        $payout = PayoutRecorder::record($resource);

        if ($payout) {
            PayoutStatusUpdated::dispatch($payout);
        }
    }
    protected function handleRefundUpdated(?array $resource): void
    {
        $refundId = $resource['id'] ?? null;
        $status = $resource['attributes']['status'] ?? null;

        if (! $refundId) {
            return;
        }

        $invoice = Invoice::where('processor_refund_id', $refundId)->first();

        if (! $invoice) {
            Log::warning('refund.updated webhook with no matching invoice', ['refund_id' => $refundId]);
            return;
        }

        if ($status === 'succeeded') {
            DB::transaction(function () use ($invoice, $resource) {
                $invoice->update([
                    'status' => 'refunded',
                    'refund_amount' => $resource['attributes']['amount'] ?? $invoice->amount,
                    'refunded_at' => now(),
                ]);

                $subscription = $invoice->subscription;

                if (! $subscription) {
                    return;
                }

                // If the member paid again after this invoice (early renewal),
                // they still have a valid paid period, so don't cancel it.
                $hasLaterPaidInvoice = $subscription->invoices()
                    ->where('status', 'paid')
                    ->where('id', '!=', $invoice->id)
                    ->where('paid_at', '>', $invoice->paid_at ?? $invoice->created_at)
                    ->exists();

                if (! $hasLaterPaidInvoice) {
                    $subscription->update([
                        'status' => 'cancelled',
                        'cancelled_at' => now(),
                        'current_period_end' => now(),
                        'next_billing_at' => null,
                    ]);
                }
            });

            InvoiceStatusUpdated::dispatch($invoice);

            StaffAlert::send(new StaffPaymentRefunded($invoice));
        } elseif ($status === 'failed') {
            $invoice->update(['status' => 'paid']);
            InvoiceStatusUpdated::dispatch($invoice);

            Log::error('PayMongo refund failed', ['invoice_id' => $invoice->id, 'refund_id' => $refundId]);
        }
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
        $paymentId = $resource['id'] ?? null; // <-- this line was missing
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

        DB::transaction(function () use ($invoice, $paymentId) {
            $invoice->update([
                'status' => 'paid',
                'processor_payment_id' => $paymentId ?? $invoice->processor_payment_id,
                'paid_at' => now(),
            ]);

            $subscription = $invoice->subscription;

            if (! $subscription) {
                Log::error('Paid invoice has no subscription', ['invoice_id' => $invoice->id]);
                return;
            }

            $daysLeftOnOldCycle = ($subscription->current_period_end && $subscription->current_period_end->isFuture())
                ? now()->diffInDays($subscription->current_period_end)
                : 0;

            $switchCredit = $subscription->remaining_days_credit ?? 0;

            $bonusDays = $daysLeftOnOldCycle + $switchCredit;

            $periodEnd = $subscription->billing_cycle === 'annual'
                ? now()->addYear()
                : now()->addMonth();

            if ($bonusDays > 0) {
                $periodEnd = $periodEnd->addDays($bonusDays);
            }

            $subscription->update([
                'status' => 'active',
                'current_period_start' => now(),
                'current_period_end' => $periodEnd,
                'next_billing_at' => $periodEnd,
                'remaining_days_credit' => 0,
            ]);

            $subscription->user->notify(new \App\Notifications\MembershipActivated($subscription));

            StaffAlert::send(new StaffNewSubscriptionCreated($subscription));
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

        if ($invoice) {
            StaffAlert::send(new StaffPaymentFailed($invoice));
        }
    }

    protected function verifySignature(Request $request): bool
    {
        $signatureHeader = $request->header('Paymongo-Signature');
        $secret = config('services.paymongo.webhook_secret');

        if (! $signatureHeader || ! $secret) {
            Log::warning('PayMongo webhook missing signature header or secret configured');
            return false;
        }

        $parts = collect(explode(',', $signatureHeader))
            ->mapWithKeys(function ($part) {
                [$key, $value] = array_pad(explode('=', $part, 2), 2, null);
                return [$key => $value];
            });

        $timestamp = $parts->get('t');

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

        // Reject stale/replayed requests — a captured valid signature must not
        // stay valid forever. 5 minutes is PayMongo's own documented tolerance.
        if (abs(time() - (int) $timestamp) > 300) {
            Log::warning('PayMongo webhook timestamp outside tolerance', ['timestamp' => $timestamp]);
            return false;
        }

        $signedPayload = $timestamp . '.' . $request->getContent();
        $computedSignature = hash_hmac('sha256', $signedPayload, $secret);

        return hash_equals($expectedSignature, $computedSignature);
    }
}
