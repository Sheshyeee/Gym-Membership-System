<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Invoice;
use App\Models\Subscription;
use App\Models\User;
use App\Support\MemberStatusResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class OverviewController extends Controller
{
    // scanned_at is stored in Asia/Manila (see AdminAttendanceController) —
    // query boundaries must stay in Asia/Manila too, never converted to
    // UTC, or counts here will drift from the attendance dashboard.
    private const DISPLAY_TZ = 'Asia/Manila';

    public function index(Request $request)
    {
        $now = Carbon::now(self::DISPLAY_TZ);
        $members = User::role('user')->with('latestSubscription')->get();

        return inertia('overview', [
            'stats' => $this->stats($now, $members),
            'revenuePerformance' => $this->revenuePerformance($now),
            'memberActivity' => $this->memberActivity($members),
            'retentionHealth' => $this->retentionHealth($now, $members),
            'attendanceOverview' => $this->attendanceOverview($now),
            'liveFinancialActivity' => $this->liveFinancialActivity(),
        ]);
    }

    /**
     * Top-row stat cards: monthly revenue, active members, payment success rate.
     */
    private function stats(Carbon $now, \Illuminate\Support\Collection $members): array
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

        // "Active members" here matches the attendance dashboard's definition:
        // currently subscribed (active OR expiring soon), not just the
        // narrower "active" bucket used in the donut breakdown below.
        $activeMembers = $members->filter(
            fn(User $u) => MemberStatusResolver::isCurrentlySubscribed($u->latestSubscription)
        )->count();

        // Snapshot of who was currently subscribed as of the end of last
        // month, based on their subscription's period dates (not created_at)
        // so it reflects what was actually true at that point in time.
        $activeMembersLastMonth = Subscription::where('current_period_start', '<=', $endOfLastMonth)
            ->where(function ($q) use ($endOfLastMonth) {
                $q->whereNull('current_period_end')->orWhere('current_period_end', '>', $endOfLastMonth);
            })
            ->where(function ($q) use ($endOfLastMonth) {
                $q->whereNull('cancelled_at')->orWhere('cancelled_at', '>', $endOfLastMonth);
            })
            ->distinct('user_id')
            ->count('user_id');

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
        $prevPaymentSuccessRate = $prev30->count() > 0 ? $successRate($prev30) : null;

        return [
            'monthlyRevenue' => round($thisMonthRevenue / 100),
            'monthlyRevenueGrowth' => $this->percentChange($thisMonthRevenue, $lastMonthRevenue),
            'activeMembers' => $activeMembers,
            'activeMembersGrowth' => $this->percentChange($activeMembers, $activeMembersLastMonth),
            'paymentSuccessRate' => $paymentSuccessRate,
            'paymentSuccessGrowth' => $prevPaymentSuccessRate === null ? null : round($paymentSuccessRate - $prevPaymentSuccessRate, 1),
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
     * Donut: active / expiring soon / expired, using the exact same rule
     * AdminMemberController uses — this is what makes it match the Members
     * page totals (role('user'), latestSubscription, 14-day expiring window).
     */
    private function memberActivity(\Illuminate\Support\Collection $members): array
    {
        $statuses = $members->map(fn(User $u) => MemberStatusResolver::resolve($u->latestSubscription));

        $active = $statuses->filter(fn($s) => $s === 'active')->count();
        $expiringSoon = $statuses->filter(fn($s) => $s === 'expiring_soon')->count();
        $expired = $statuses->filter(fn($s) => $s === 'expired')->count();
        $total = max($members->count(), 1);

        return [
            'total' => $members->count(),
            'breakdown' => [
                ['label' => 'Active', 'value' => $active, 'percent' => round($active / $total * 100)],
                ['label' => 'Expiring', 'value' => $expiringSoon, 'percent' => round($expiringSoon / $total * 100)],
                ['label' => 'Expired', 'value' => $expired, 'percent' => round($expired / $total * 100)],
            ],
        ];
    }

    /**
     * Of members whose subscription had already started 30+ days ago, how
     * many are still currently subscribed today. Returns a neutral "not
     * enough data" state instead of a misleading 0% "at risk" reading when
     * nobody has 30 days of history yet.
     */
    private function retentionHealth(Carbon $now, \Illuminate\Support\Collection $members): array
    {
        $cutoff = $now->copy()->subDays(30);

        $eligible = $members->filter(function (User $u) use ($cutoff) {
            $start = $u->latestSubscription?->current_period_start;

            return $start && Carbon::parse($start)->lte($cutoff);
        });

        if ($eligible->isEmpty()) {
            return [
                'rate' => 0,
                'change' => 0,
                'label' => 'Not enough data',
                'status' => 'neutral',
            ];
        }

        $retained = $eligible->filter(
            fn(User $u) => MemberStatusResolver::isCurrentlySubscribed($u->latestSubscription)
        )->count();
        $rate = (int) round(($retained / $eligible->count()) * 100);

        $quarterCutoff = $now->copy()->subMonths(3)->subDays(30);
        $eligibleQuarterAgo = $members->filter(function (User $u) use ($quarterCutoff) {
            $start = $u->latestSubscription?->current_period_start;

            return $start && Carbon::parse($start)->lte($quarterCutoff);
        });
        $rateQuarterAgo = 0;
        if ($eligibleQuarterAgo->isNotEmpty()) {
            $retainedQuarterAgo = $eligibleQuarterAgo->filter(
                fn(User $u) => MemberStatusResolver::isCurrentlySubscribed($u->latestSubscription)
            )->count();
            $rateQuarterAgo = (int) round(($retainedQuarterAgo / $eligibleQuarterAgo->count()) * 100);
        }

        $status = match (true) {
            $rate >= 70 => 'healthy',
            $rate >= 50 => 'warning',
            default => 'risk',
        };

        return [
            'rate' => $rate,
            'change' => $rate - $rateQuarterAgo,
            'label' => match ($status) {
                'healthy' => 'Healthy',
                'warning' => 'Needs attention',
                default => 'At risk',
            },
            'status' => $status,
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
            ->get(['scanned_at'])
            ->groupBy(fn(Attendance $a) => (int) $a->scanned_at->setTimezone(self::DISPLAY_TZ)->format('G'))
            ->map(fn($group, $hour) => ['hour' => $hour, 'total' => $group->count()])
            ->sortByDesc('total')
            ->first();

        $weekStart = $now->copy()->startOfWeek();
        $weekCounts = Attendance::where('status', 'success')
            ->whereBetween('scanned_at', [$weekStart, $now->copy()->endOfDay()])
            ->get(['scanned_at'])
            ->countBy(fn(Attendance $a) => $a->scanned_at->setTimezone(self::DISPLAY_TZ)->format('Y-m-d'));

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
            'peakHour' => $peakHour ? Carbon::createFromTime((int) $peakHour['hour'])->format('g A') : null,
            'week' => $week,
        ];
    }

    private function liveFinancialActivity(int $limit = 5): array
    {
        return Invoice::with(['user:id,name', 'plan:id,name', 'subscription:id,billing_cycle'])
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

    /**
     * Returns null (instead of a misleading 100%) when there's no prior
     * period to compare against — the frontend shows a "New" badge for that.
     */
    private function percentChange(float $current, float $previous): ?float
    {
        if ($previous > 0) {
            return round((($current - $previous) / $previous) * 100, 1);
        }

        return null;
    }
}
