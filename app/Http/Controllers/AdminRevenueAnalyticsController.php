<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminRevenueAnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->string('period', 'week')->value();
        $period = in_array($period, ['week', 'month', 'quarter', 'year']) ? $period : 'week';

        [$start, $end, $prevStart, $prevEnd, $granularity] = $this->resolvePeriod($period);

        $totalRevenue = $this->netRevenueBetween($start, $end);
        $prevTotalRevenue = $this->netRevenueBetween($prevStart, $prevEnd);

        $paidInvoicesCount = Invoice::query()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$start, $end])
            ->count();
        $prevPaidInvoicesCount = Invoice::query()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$prevStart, $prevEnd])
            ->count();

        $avgOrderValue = $paidInvoicesCount > 0 ? $totalRevenue / $paidInvoicesCount : 0;
        $prevAvgOrderValue = $prevPaidInvoicesCount > 0 ? $prevTotalRevenue / $prevPaidInvoicesCount : 0;

        $newMembers = $this->newMembersBetween($start, $end);
        $prevNewMembers = $this->newMembersBetween($prevStart, $prevEnd);

        return inertia('admin/revenue-analytics', [
            'period' => $period,
            'stats' => [
                'totalRevenue' => [
                    'value' => $totalRevenue,
                    'changePct' => $this->pctChange($totalRevenue, $prevTotalRevenue),
                ],
                'averageOrderValue' => [
                    'value' => (int) round($avgOrderValue),
                    'changePct' => $this->pctChange($avgOrderValue, $prevAvgOrderValue),
                ],
                'newMembers' => [
                    'value' => $newMembers,
                    'changePct' => $this->pctChange($newMembers, $prevNewMembers),
                ],
            ],
            'trend' => $this->buildTrend($start, $end, $prevStart, $prevEnd, $granularity),
            'revenueByPlan' => $this->buildRevenueByPlan($start, $end),
        ]);
    }

    private function resolvePeriod(string $period): array
    {
        $now = Carbon::now();

        return match ($period) {
            'month' => [
                $now->copy()->startOfMonth(),
                $now->copy()->endOfMonth(),
                $now->copy()->subMonthNoOverflow()->startOfMonth(),
                $now->copy()->subMonthNoOverflow()->endOfMonth(),
                'day',
            ],
            'quarter' => [
                $now->copy()->firstOfQuarter(),
                $now->copy()->lastOfQuarter(),
                $now->copy()->subMonthsNoOverflow(3)->firstOfQuarter(),
                $now->copy()->subMonthsNoOverflow(3)->lastOfQuarter(),
                'month',
            ],
            'year' => [
                $now->copy()->startOfYear(),
                $now->copy()->endOfYear(),
                $now->copy()->subYearNoOverflow()->startOfYear(),
                $now->copy()->subYearNoOverflow()->endOfYear(),
                'month',
            ],
            default => [
                $now->copy()->startOfWeek(Carbon::MONDAY),
                $now->copy()->endOfWeek(Carbon::SUNDAY),
                $now->copy()->subWeek()->startOfWeek(Carbon::MONDAY),
                $now->copy()->subWeek()->endOfWeek(Carbon::SUNDAY),
                'day',
            ],
        };
    }

    private function netRevenueBetween(Carbon $start, Carbon $end): int
    {
        return (int) Invoice::query()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$start, $end])
            ->selectRaw('COALESCE(SUM(amount - COALESCE(refund_amount, 0)), 0) as net')
            ->value('net');
    }

    private function newMembersBetween(Carbon $start, Carbon $end): int
    {
        // "New member" = a user whose very first subscription (of any plan)
        // started in this period. Plan switches / renewals don't count.
        // ASSUMPTION: subscriptions.created_at marks when the subscription
        // record was first created (default Eloquent timestamps).
        $firstSubscriptions = DB::table('subscriptions')
            ->select('user_id', DB::raw('MIN(created_at) as first_subscribed_at'))
            ->groupBy('user_id');

        return DB::query()
            ->fromSub($firstSubscriptions, 'first_subs')
            ->whereBetween('first_subscribed_at', [$start, $end])
            ->count();
    }

    private function pctChange(float $current, float $previous): float
    {
        if ($previous == 0.0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    private function buildTrend(Carbon $start, Carbon $end, Carbon $prevStart, Carbon $prevEnd, string $granularity): array
    {
        $current = $this->bucketedRevenue($start, $end, $granularity);
        $previous = $this->bucketedRevenue($prevStart, $prevEnd, $granularity);

        $points = [];
        $count = max(count($current), count($previous));

        for ($i = 0; $i < $count; $i++) {
            $points[] = [
                'label' => $current[$i]['label'] ?? $previous[$i]['label'] ?? '',
                'current' => $current[$i]['value'] ?? 0,
                'previous' => $previous[$i]['value'] ?? 0,
            ];
        }

        return $points;
    }

    private function bucketedRevenue(Carbon $start, Carbon $end, string $granularity): array
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            $format = $granularity === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';
            $bucketExpr = "TO_CHAR(paid_at, '{$format}')";
        } else {
            $format = $granularity === 'day' ? '%Y-%m-%d' : '%Y-%m';
            $bucketExpr = "DATE_FORMAT(paid_at, '{$format}')";
        }

        $rows = Invoice::query()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$start, $end])
            ->selectRaw("{$bucketExpr} as bucket, SUM(amount - COALESCE(refund_amount, 0)) as net")
            ->groupBy('bucket')
            ->pluck('net', 'bucket');

        $points = [];
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            $key = $granularity === 'day' ? $cursor->format('Y-m-d') : $cursor->format('Y-m');
            $label = $granularity === 'day' ? $cursor->format('D') : $cursor->format('M');

            $points[] = [
                'label' => $label,
                'value' => (int) ($rows[$key] ?? 0),
            ];

            $granularity === 'day' ? $cursor->addDay() : $cursor->addMonthNoOverflow();
        }

        return $points;
    }

    private function buildRevenueByPlan(Carbon $start, Carbon $end): array
    {
        $revenueByPlan = Invoice::query()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$start, $end])
            ->selectRaw('plan_id, SUM(amount - COALESCE(refund_amount, 0)) as net')
            ->groupBy('plan_id')
            ->pluck('net', 'plan_id');

        return Plan::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn(Plan $plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'color' => $plan->color,
                'revenue' => (int) ($revenueByPlan[$plan->id] ?? 0),
            ])
            ->filter(fn($plan) => $plan['revenue'] > 0)
            ->sortByDesc('revenue')
            ->values()
            ->all();
    }
}
