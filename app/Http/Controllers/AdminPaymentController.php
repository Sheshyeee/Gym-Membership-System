<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use RuntimeException;

class AdminPaymentController extends Controller
{
    public function __construct(protected PaymentService $payments) {}

    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'all');

        $invoices = Invoice::query()
            ->with(['user:id,name', 'plan:id,name'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('id', 'like', "%{$search}%")
                        ->orWhereHas('user', fn($q) => $q->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($status !== 'all' && $status !== '', fn($query) => $query->where('status', $status))
            ->latest()
            ->get()
            ->map(fn(Invoice $invoice) => [
                'id' => $invoice->id,
                // NOTE: using the invoice id directly since there's no separate
                // human-facing transaction number in the schema yet.
                'transaction_id' => 'TXN-' . str_pad((string) $invoice->id, 6, '0', STR_PAD_LEFT),
                'member' => $invoice->user->name ?? 'Unknown',
                'plan' => $invoice->plan->name ?? '—',
                'amount' => $invoice->amount,
                'currency' => $invoice->currency,
                'method' => $invoice->payment_method_type,
                'status' => $invoice->status,
                'webhook_status' => in_array($invoice->status, ['paid', 'refunded', 'failed'], true) ? 'verified' : 'pending',
                'created_at' => $invoice->created_at->toIso8601String(),
                'paid_at' => $invoice->paid_at?->toIso8601String(),
                'refunded_at' => $invoice->refunded_at?->toIso8601String(),
                'can_refund' => $invoice->status === 'paid' && $invoice->processor_payment_id !== null,
            ]);

        return Inertia::render('admin/payments', [
            'invoices' => $invoices,
            'filters' => ['search' => $search, 'status' => $status ?: 'all'],
        ]);
    }

    public function refund(Request $request, Invoice $invoice)
    {
        if ($invoice->status !== 'paid') {
            return back()->withErrors(['refund' => 'Only paid invoices can be refunded.']);
        }

        if (! $invoice->processor_payment_id) {
            return back()->withErrors(['refund' => 'No payment record found for this invoice — nothing to refund.']);
        }

        try {
            $refund = $this->payments->createRefund(
                paymentId: $invoice->processor_payment_id,
                amount: $invoice->amount,
                idempotencyKey: "refund-create-{$invoice->id}",
            );
        } catch (RuntimeException $e) {
            return back()->withErrors(['refund' => $e->getMessage()]);
        }

        // Mirrors the existing pattern: don't mark 'refunded' here, wait for
        // the refund.updated webhook to confirm it actually went through.
        $invoice->update([
            'status' => 'refunding',
            'processor_refund_id' => $refund['id'],
        ]);

        return back()->with('success', 'Refund initiated. It will confirm once PayMongo processes it.');
    }
    public function retry(Invoice $invoice)
    {
        if (! in_array($invoice->status, ['pending', 'failed'], true)) {
            return back()->withErrors(['retry' => 'Only pending or failed invoices can be retried.']);
        }

        if (! in_array($invoice->payment_method_type, ['gcash', 'paymaya'], true)) {
            return back()->withErrors(['retry' => 'Retry is only supported for GCash and Maya.']);
        }

        $invoice->increment('retry_count');

        try {
            $source = $this->payments->createSource(
                amount: $invoice->amount,
                type: $invoice->payment_method_type,
                redirectSuccessUrl: route('onboarding.payment.return', ['invoice' => $invoice->id]),
                redirectFailedUrl: route('onboarding.payment.return', ['invoice' => $invoice->id, 'failed' => 1]),
                // Unique per attempt: reusing the prior key would make PayMongo
                // replay the old (expired/dead) source instead of minting a new one.
                idempotencyKey: "source-create-{$invoice->id}-retry-{$invoice->retry_count}",
            );
        } catch (RuntimeException $e) {
            return back()->withErrors(['retry' => $e->getMessage()]);
        }

        $invoice->update([
            'processor_source_id' => $source['id'],
            'status' => 'pending',
        ]);

        return back()->with([
            'success' => 'New checkout link generated.',
            'retry_checkout_url' => $source['attributes']['redirect']['checkout_url'],
        ]);
    }
}
