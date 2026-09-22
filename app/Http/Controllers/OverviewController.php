<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Invoice;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class OverviewController extends Controller
{
    public function index(Request $request)
    {
        $now = Carbon::now();

        return inertia('overview', [
            'stats' => $this->stats($now),
            'revenuePerformance' => $this->revenuePerformance($now),
            'memberActivity' => $this->memberActivity($now),
            'retentionHealth' => $this->retentionHealth($now),
            'attendanceOverview' => $this->attendanceOverview($now),
            'liveFinancialActivity' => $this->liveFinancialActivity(),
        ]);
    }

    /**
     * Top-row stat cards: monthly revenue, active members, payment success rate.
     */
    private function stats(Carbon $now): array
    {
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $now->copy()->subMonthNoOverflow()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonthNoOverflow()->endOfMonth();

        $thisMonthRevenue = (int) Invoice::where('status', 'paid')
            ->whereBetween('paid_at', [$startOfMonth, $now])
            ->sum('amount');

        $lastMonthRevenue = (int) Invoice::where('status', 'paid')
            ->whereBetween('paid_at', [$startOfLastMonth, $endOfLastMonth])
            ->sum('amount');

        $activeMembers = User::whereHas('subscriptions', fn($q) => $q->where('status', 'active'))->count();

        // Active members as of the end of last month, for a rough month-over-month trend.
        $activeMembersLastMonth = User::whereHas('subscriptions', function ($q) use ($endOfLastMonth) {
            $q->where('status', 'active')->where('created_at', '<=', $endOfLastMonth);
        })->count();

        $last30 = Invoice::where('created_at', '>=', $now->copy()->subDays(30))
            ->whereIn('status', ['paid', 'failed'])
            ->get(['status']);
        $prev30 = Invoice::whereBetween('created_at', [$now->copy()->subDays(60), $now->copy()->subDays(30)])
            ->whereIn('status', ['paid', 'failed'])
            ->get(['status']);

        $successRate = fn($invoices) => $invoices->count() > 0
            ? round(($invoices->where('status', 'paid')->count() / $invoices->count()) * 100, 1)
            : 100.0;

        $paymentSuccessRate = $successRate($last30);
        $prevPaymentSuccessRate = $successRate($prev30);

        return [
            'monthlyRevenue' => round($thisMonthRevenue / 100),
            'monthlyRevenueGrowth' => $this->percentChange($thisMonthRevenue, $lastMonthRevenue),
            'activeMembers' => $activeMembers,
            'activeMembersGrowth' => $this->percentChange($activeMembers, $activeMembersLastMonth),
            'paymentSuccessRate' => $paymentSuccessRate,
            'paymentSuccessGrowth' => round($paymentSuccessRate - $prevPaymentSuccessRate, 1),
        ];
    }

    /**
     * Monthly revenue this year vs the same months last year, for the main line chart.
     */
    private function revenuePerformance(Carbon $now): array
    {
        $startOfYear = $now->copy()->startOfYear();
        $lastYearStart = $startOfYear->copy()->subYear();
        $lastYearEnd = $startOfYear->copy()->subDay();

        $thisYear = Invoice::where('status', 'paid')
            ->whereBetween('paid_at', [$startOfYear, $now])
            ->selectRaw('MONTH(paid_at) as month, SUM(amount) as total')
            ->groupBy('month')
            ->pluck('total', 'month');

        $lastYear = Invoice::where('status', 'paid')
            ->whereBetween('paid_at', [$lastYearStart, $lastYearEnd])
            ->selectRaw('MONTH(paid_at) as month, SUM(amount) as total')
            ->groupBy('month')
            ->pluck('total', 'month');

        return collect(range(1, 12))->map(function (int $month) use ($thisYear, $lastYear, $now) {
            $isFuture = $month > $now->month;

            return [
                'month' => Carbon::create()->month($month)->format('M'),
                'revenue' => $isFuture ? null : round(($thisYear[$month] ?? 0) / 100),
                'lastYear' => round(($lastYear[$month] ?? 0) / 100),
            ];
        })->values()->all();
    }

    /**
     * Donut: active / expiring soon (next 7 days) / expired, across everyone who has ever subscribed.
     */
    private function memberActivity(Carbon $now): array
    {
        $expiringSoon = Subscription::where('status', 'active')
            ->whereNotNull('current_period_end')
            ->whereBetween('current_period_end', [$now, $now->copy()->addDays(7)])
            ->count();

        $active = Subscription::where('status', 'active')
            ->where(function ($q) use ($now) {
                $q->whereNull('current_period_end')
                    ->orWhere('current_period_end', '>', $now->copy()->addDays(7));
            })
            ->count();

        $expired = Subscription::where('status', '!=', 'active')
            ->whereNotNull('current_period_end')
            ->where('current_period_end', '<=', $now)
            ->count();

        $total = max($active + $expiringSoon + $expired, 1);

        return [
            'total' => $active + $expiringSoon + $expired,
            'breakdown' => [
                ['label' => 'Active', 'value' => $active, 'percent' => round($active / $total * 100)],
                ['label' => 'Expiring', 'value' => $expiringSoon, 'percent' => round($expiringSoon / $total * 100)],
                ['label' => 'Expired', 'value' => $expired, 'percent' => round($expired / $total * 100)],
            ],
        ];
    }

    /**
     * Rough retention: of members whose subscription had already started 30+ days ago,
     * how many are still active today.
     */
    private function retentionHealth(Carbon $now): array
    {
        $cutoff = $now->copy()->subDays(30);

        $eligible = Subscription::where('current_period_start', '<=', $cutoff)
            ->distinct('user_id')
            ->count('user_id');

        $retained = User::whereHas('subscriptions', function ($q) use ($cutoff) {
            $q->where('current_period_start', '<=', $cutoff);
        })->whereHas('subscriptions', fn($q) => $q->where('status', 'active'))->count();

        $rate = $eligible > 0 ? round(($retained / $eligible) * 100) : 0;

        // Compare against the same calculation a quarter ago for the "vs last quarter" badge.
        $quarterCutoff = $now->copy()->subMonths(3)->subDays(30);
        $eligibleQuarterAgo = Subscription::where('current_period_start', '<=', $quarterCutoff)->distinct('user_id')->count('user_id');
        $retainedQuarterAgo = User::whereHas('subscriptions', function ($q) use ($quarterCutoff) {
            $q->where('current_period_start', '<=', $quarterCutoff);
        })->whereHas('subscriptions', fn($q) => $q->where('status', 'active'))->count();
        $rateQuarterAgo = $eligibleQuarterAgo > 0 ? round(($retainedQuarterAgo / $eligibleQuarterAgo) * 100) : 0;

        return [
            'rate' => $rate,
            'change' => $rate - $rateQuarterAgo,
            'label' => $rate >= 70 ? 'Healthy' : ($rate >= 50 ? 'Needs attention' : 'At risk'),
        ];
    }

    /**
     * Check-ins today, peak hour, and a Mon-Sun bar chart of successful check-ins.
     * No check-out event exists on the attendances table, so only check-ins are reported.
     */
    private function attendanceOverview(Carbon $now): array
    {
        $today = $now->copy()->startOfDay();
        $yesterday = $today->copy()->subDay();

        $checkInsToday = Attendance::where('status', 'success')
            ->whereBetween('scanned_at', [$today, $today->copy()->endOfDay()])
            ->count();

        $checkInsYesterday = Attendance::where('status', 'success')
            ->whereBetween('scanned_at', [$yesterday, $yesterday->copy()->endOfDay()])
            ->count();

        $peakHour = Attendance::where('status', 'success')
            ->whereBetween('scanned_at', [$today, $today->copy()->endOfDay()])
            ->selectRaw('HOUR(scanned_at) as hour, COUNT(*) as total')
            ->groupBy('hour')
            ->orderByDesc('total')
            ->first();

        $weekStart = $now->copy()->startOfWeek();
        $weekCounts = Attendance::where('status', 'success')
            ->whereBetween('scanned_at', [$weekStart, $now->copy()->endOfDay()])
            ->selectRaw('DATE(scanned_at) as day, COUNT(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $week = collect(range(0, 6))->map(function (int $offset) use ($weekStart, $weekCounts, $today) {
            $date = $weekStart->copy()->addDays($offset);

            return [
                'label' => $date->format('D')[0],
                'count' => (int) ($weekCounts[$date->format('Y-m-d')] ?? 0),
                'isToday' => $date->isSameDay($today),
            ];
        })->values()->all();

        return [
            'checkInsToday' => $checkInsToday,
            'checkInsGrowth' => $this->percentChange($checkInsToday, $checkInsYesterday),
            'peakHour' => $peakHour ? $this->formatHourRange((int) $peakHour->hour) : null,
            'week' => $week,
        ];
    }

    private function liveFinancialActivity(int $limit = 5): array
    {
        return Invoice::with(['user:id,name', 'plan:id,name'])
            ->where('status', 'paid')
            ->latest('paid_at')
            ->take($limit)
            ->get()
            ->map(fn(Invoice $invoice) => [
                'id' => $invoice->id,
                'user' => $invoice->user?->name,
                'plan' => $invoice->plan?->name,
                'billingCycle' => $invoice->subscription?->billing_cycle,
                'amount' => round($invoice->amount / 100),
                'currency' => $invoice->currency,
                'paidAt' => $invoice->paid_at,
            ])
            ->values()
            ->all();
    }

    private function percentChange(float $current, float $previous): float
    {
        if ($previous > 0) {
            return round((($current - $previous) / $previous) * 100, 1);
        }

        return $current > 0 ? 100.0 : 0.0;
    }

    private function formatHourRange(int $hour): string
    {
        $start = Carbon::createFromTime($hour);
        $end = $start->copy()->addHours(2);

        return $start->format('g A') . '-' . $end->format('g A');
    }
}
