<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Illuminate\Console\Command;

class BackfillSubscriptionPeriods extends Command
{
    protected $signature = 'subscriptions:backfill-periods';
    protected $description = 'Backfill current_period_start/end for subscriptions predating the webhook fix';

    public function handle(): int
    {
        $subscriptions = Subscription::whereNull('current_period_end')
            ->where('status', 'active')
            ->with('invoices')
            ->get();

        $this->info("Found {$subscriptions->count()} active subscriptions with no period data.");

        foreach ($subscriptions as $subscription) {
            $paidInvoice = $subscription->invoices->firstWhere('status', 'paid');
            $start = $paidInvoice?->paid_at ?? $subscription->created_at;

            $end = $subscription->billing_cycle === 'annual'
                ? $start->copy()->addYear()
                : $start->copy()->addMonth();

            $subscription->update([
                'current_period_start' => $start,
                'current_period_end' => $end,
                'next_billing_at' => $end,
            ]);

            $this->line("Subscription #{$subscription->id}: period set {$start->toDateString()} → {$end->toDateString()}");
        }

        return self::SUCCESS;
    }
}
