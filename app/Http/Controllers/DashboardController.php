<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->hasRole('admin')) {
            return redirect()->route('overview');
        }

        if ($user->hasRole('staff')) {
            return redirect()->route('staff.dashboard');
        }

        $hasSubscription = $user->hasActiveSubscription();

        $current = $user->activeSubscription()->with('plan')->first();

        $month = (int) $request->input('month', now()->month);
        $year = (int) $request->input('year', now()->year);

        $selected = Carbon::create($year, $month, 1)->startOfMonth();
        $today = now();

        // NOTE: 'verified' is a guess for the success status value.
        // Confirm against StaffCheckInsController@scan.
        $attendances = Attendance::where('user_id', $user->id)
            ->where('status', 'success')
            ->orderBy('scanned_at')
            ->get(['id', 'status', 'method', 'scanned_at']);

        $byDate = $attendances->groupBy(fn($a) => $a->scanned_at->toDateString());

        // ---- Calendar grid for selected month ----
        $calendar = [];
        $cursor = $selected->copy();
        $end = $selected->copy()->endOfMonth();

        while ($cursor <= $end) {
            $calendar[] = [
                'day' => $cursor->day,
                'date' => $cursor->toDateString(),
                'weekday' => $cursor->dayOfWeekIso, // 1 = Mon ... 7 = Sun
                'checked_in' => $byDate->has($cursor->toDateString()),
                'is_future' => $cursor->isAfter($today->copy()->endOfDay()),
            ];
            $cursor->addDay();
        }

        // ---- This month vs last month ----
        $lastMonth = $selected->copy()->subMonth();

        $visitsThisMonth = $attendances->filter(
            fn($a) => $a->scanned_at->isSameMonth($selected) && $a->scanned_at->year === $selected->year
        )->count();

        $visitsLastMonth = $attendances->filter(
            fn($a) => $a->scanned_at->isSameMonth($lastMonth) && $a->scanned_at->year === $lastMonth->year
        )->count();

        $percentChange = $visitsLastMonth > 0
            ? (int) round((($visitsThisMonth - $visitsLastMonth) / $visitsLastMonth) * 100)
            : ($visitsThisMonth > 0 ? 100 : 0);

        // ---- Weekly rhythm: rolling 8 weeks (Mon-Sun) ending at the selected month ----
        $windowEnd = $selected->isSameMonth($today)
            ? $today->copy()->endOfWeek(Carbon::SUNDAY)
            : $selected->copy()->endOfMonth()->endOfWeek(Carbon::SUNDAY);

        $weeks = [];
        for ($i = 7; $i >= 0; $i--) {
            $weekStart = $windowEnd->copy()->subWeeks($i)->startOfWeek(Carbon::MONDAY);
            $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);

            $count = $attendances->filter(
                fn($a) => $a->scanned_at->between($weekStart->startOfDay(), $weekEnd->endOfDay())
            )->count();

            $weeks[] = [
                'label' => $weekStart->format('M j'),
                'visits' => $count,
            ];
        }
        $weeks = array_slice($weeks, -8);

        $daysElapsedThisMonth = $selected->isSameMonth($today) ? $today->day : $end->day;
        $weeksElapsed = max(1, (int) ceil($daysElapsedThisMonth / 7));
        $avgVisitsPerWeek = round($visitsThisMonth / $weeksElapsed, 1);

        // ---- Streaks ----
        $streak = 0;
        $cursorDay = $today->copy()->startOfDay();
        while ($byDate->has($cursorDay->toDateString())) {
            $streak++;
            $cursorDay->subDay();
        }
        $bestStreak = $this->longestStreak($byDate->keys()->all());

        // ---- Attendance rate vs trailing 3-month average ----
        $rateThisMonth = $daysElapsedThisMonth > 0
            ? (int) round(($visitsThisMonth / $daysElapsedThisMonth) * 100)
            : 0;

        $trailingRates = [];
        for ($i = 1; $i <= 3; $i++) {
            $m = $selected->copy()->subMonths($i);
            $visits = $attendances->filter(
                fn($a) => $a->scanned_at->isSameMonth($m) && $a->scanned_at->year === $m->year
            )->count();
            $trailingRates[] = ($visits / $m->daysInMonth) * 100;
        }
        $avgRate = count($trailingRates) ? array_sum($trailingRates) / count($trailingRates) : 0;

        // ---- Recent check-ins (latest 4, regardless of selected month) ----
        $recent = Attendance::where('user_id', $user->id)
            ->where('status', 'success')
            ->orderByDesc('scanned_at')
            ->limit(4)
            ->get()
            ->map(function ($a) {
                $date = $a->scanned_at;
                $when = $date->isToday()
                    ? 'Today, ' . $date->format('g:i A')
                    : ($date->isYesterday()
                        ? 'Yesterday, ' . $date->format('g:i A')
                        : $date->format('M j, g:i A'));

                return ['id' => $a->id, 'when' => $when, 'method' => $a->method];
            });

        // ---- Months available for the single month picker ----
        $availableMonths = collect($attendances)
            ->map(fn($a) => $a->scanned_at->format('Y-m'))
            ->push($today->format('Y-m'))
            ->unique()
            ->sortDesc()
            ->values()
            ->map(function ($ym) {
                $c = Carbon::createFromFormat('Y-m', $ym);
                return ['value' => $ym, 'label' => $c->format('F Y')];
            });

        return Inertia::render('member/dashboard', [
            'hasSubscription' => $hasSubscription,
            'currentMembership' => $current ? [
                'plan_name' => $current->plan->name,
                'tagline' => $current->plan->tagline,
                'status' => $current->status,
                'valid_until' => $current->current_period_end?->format('F j, Y'),
                'days_remaining' => $current->current_period_end?->isFuture()
                    ? (int) now()->diffInDays($current->current_period_end)
                    : 0,
                'percent_used' => $this->percentUsed($current),
            ] : null,
            'selectedMonth' => $selected->format('Y-m'),
            'selectedMonthLabel' => $selected->format('F Y'),
            'availableMonths' => $availableMonths,
            'calendar' => $calendar,
            'stats' => [
                'visits' => $visitsThisMonth,
                'visitsChangeVsLastMonth' => $percentChange,
                'currentStreak' => $streak,
                'bestStreak' => $bestStreak,
                'attendanceRate' => $rateThisMonth,
                'attendanceRateAboveAverage' => $rateThisMonth >= (int) round($avgRate),
            ],
            'weeklyRhythm' => $weeks,
            'avgVisitsPerWeek' => $avgVisitsPerWeek,
            'recentCheckIns' => $recent,
        ]);
    }

    private function percentUsed(Subscription $sub): int
    {
        if (! $sub->current_period_start || ! $sub->current_period_end) {
            return 0;
        }

        $total = $sub->current_period_start->diffInSeconds($sub->current_period_end);

        if ($total <= 0) {
            return 100;
        }

        $elapsed = $sub->current_period_start->diffInSeconds(now());

        return (int) min(100, max(0, round($elapsed / $total * 100)));
    }

    private function longestStreak(array $dates): int
    {
        if (empty($dates)) {
            return 0;
        }

        sort($dates);
        $longest = 1;
        $current = 1;

        for ($i = 1; $i < count($dates); $i++) {
            $prev = Carbon::parse($dates[$i - 1]);
            $curr = Carbon::parse($dates[$i]);

            if ($prev->diffInDays($curr) === 1) {
                $current++;
                $longest = max($longest, $current);
            } else {
                $current = 1;
            }
        }

        return $longest;
    }
}
    