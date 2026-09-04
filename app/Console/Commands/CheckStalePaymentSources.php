<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Services\PaymentService;
use Illuminate\Console\Command;

class CheckStalePaymentSources extends Command
{
    protected $signature = 'payments:check-stale-sources';
    protected $description = 'Poll PayMongo for pending invoices whose Source may have expired or failed, since PayMongo sends no webhook for that.';

    public function handle(PaymentService $payments): void
    {
        $staleInvoices = Invoice::where('status', 'pending')
            ->whereNotNull('processor_source_id')
            ->where('created_at', '<', now()->subMinutes(5))
            ->get();

        foreach ($staleInvoices as $invoice) {
            $source = $payments->retrieveSource($invoice->processor_source_id);
            $sourceStatus = $source['attributes']['status'] ?? null;

            if (in_array($sourceStatus, ['expired', 'failed', 'cancelled'], true)) {
                $invoice->update(['status' => 'failed']);
                $this->info("Invoice {$invoice->id} marked failed (source status: {$sourceStatus})");
            }
        }
    }
}
