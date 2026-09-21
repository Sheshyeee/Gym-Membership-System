<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Subscription;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class StaffDashboardController extends Controller
{
    private const TZ = 'Asia/Manila';

    public function index(Request $request)
    {
        $staff = $request->user();
        $now = now(self::TZ);

        return Inertia::render('staffs/dashboard', [
            'greeting' => [
                'name' => explode(' ', $staff->name)[0],
                'timeOfDay' => $this->timeOfDay($now),
                'dateLabel' => $now->format('l, F j, Y'),
            ],
            'stats' => $this->stats($now),
            'attendanceOverview' => $this->attendanceOverview($now),
            'liveActivity' => $this->liveActivity(),
        ]);
    }

    private function timeOfDay(CarbonInterface $now): string
    {
        $hour = (int) $now->format('G');

        return match (true) {
            $hour < 12 => 'morning',
            $hour < 18 => 'afternoon',
            default => 'evening',
        };
    }

    private function stats(CarbonInterface $now): array
    {
        $todayStart = $now->copy()->startOfDay();
        $todayEnd = $now->copy()->endOfDay();

        // Compare to the same weekday last week (matches "vs 214 last Tuesday")
        $lastWeekSameDay = $now->copy()->subWeek();
        $lastWeekStart = $lastWeekSameDay->copy()->startOfDay();
        $lastWeekEnd = $lastWeekSameDay->copy()->endOfDay();

        $checkInsToday = Attendance::where('status', 'success')
            ->whereBetween('scanned_at', [$todayStart, $todayEnd])
            ->count();

        $checkInsLastWeekSameDay = Attendance::where('status', 'success')
            ->whereBetween('scanned_at', [$lastWeekStart, $lastWeekEnd])
            ->count();

        $checkInsChange = $this->percentChange($checkInsLastWeekSameDay, $checkInsToday);

        // "New members" = users whose EARLIEST subscription record falls in
        // the given month. Protects against a renewal being miscounted as new.
        $monthStart = $now->copy()->startOfMonth();
        $monthEnd = $now->copy()->endOfMonth();
        $lastMonthStart = $now->copy()->subMonthNoOverflow()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonthNoOverflow()->endOfMonth();

        $firstSubscriptionDates = Subscription::selectRaw('user_id, MIN(created_at) as first_created_at')
            ->groupBy('user_id')
            ->pluck('first_created_at', 'user_id');

        $newMembersThisMonth = $firstSubscriptionDates->filter(
            fn($date) => Carbon::parse($date)->between($monthStart, $monthEnd)
        )->count();

        $newMembersLastMonth = $firstSubscriptionDates->filter(
            fn($date) => Carbon::parse($date)->between($lastMonthStart, $lastMonthEnd)
        )->count();

        $newMembersChange = $this->percentChange($newMembersLastMonth, $newMembersThisMonth);

        $activeMembers = Subscription::where('status', 'active')
            ->where(function ($q) use ($now) {
                $q->whereNull('current_period_end')
                    ->orWhere('current_period_end', '>=', $now);
            })
            ->distinct('user_id')
            ->count('user_id');

        return [
            'checkInsToday' => [
                'value' => $checkInsToday,
                'change' => $checkInsChange,
                'compareLabel' => "{$checkInsLastWeekSameDay} last {$lastWeekSameDay->format('l')}",
            ],
            'newMembersThisMonth' => [
                'value' => $newMembersThisMonth,
                'change' => $newMembersChange,
            ],
            'activeMembers' => [
                'value' => $activeMembers,
            ],
            'peakHours' => $this->peakHoursLabel($now),
        ];
    }

    private function percentChange(int $previous, int $current): float
    {
        if ($previous === 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    private function peakHoursLabel(CarbonInterface $now): string
    {
        $start = $now->copy()->subDays(6)->startOfDay();

        $hourly = Attendance::where('status', 'success')
            ->where('scanned_at', '>=', $start)
            ->get(['scanned_at'])
            ->groupBy(fn($a) => (int) $a->scanned_at->timezone(self::TZ)->format('G'))
            ->map->count();

        if ($hourly->isEmpty()) {
            return '—';
        }

        $bestHour = 0;
        $bestTotal = -1;

        for ($h = 0; $h < 24; $h++) {
            $total = ($hourly[$h] ?? 0) + ($hourly[($h + 1) % 24] ?? 0);
            if ($total > $bestTotal) {
                $bestTotal = $total;
                $bestHour = $h;
            }
        }

        $startLabel = Carbon::createFromTime($bestHour, 0, 0, self::TZ)->format('g A');
        $endLabel = Carbon::createFromTime(($bestHour + 2) % 24, 0, 0, self::TZ)->format('g A');

        return "{$startLabel} – {$endLabel}";
    }

    private function attendanceOverview(CarbonInterface $now): array
    {
        $days = collect(range(6, 0))->map(fn($i) => $now->copy()->subDays($i)->startOfDay());

        $records = Attendance::where('scanned_at', '>=', $days->first())
            ->get(['status', 'scanned_at']);

        $series = $days->map(function (CarbonInterface $day) use ($records) {
            $dayRecords = $records->filter(
                fn($a) => $a->scanned_at->timezone(self::TZ)->isSameDay($day)
            );

            return [
                'label' => $day->format('M j'),
                'checkIns' => $dayRecords->where('status', 'success')->count(),
                'denied' => $dayRecords->where('status', 'denied')->count(),
            ];
        })->values();

        $totalCheckIns = $series->sum('checkIns');

        $previousWeekCheckIns = Attendance::where('status', 'success')
            ->whereBetween('scanned_at', [
                $days->first()->copy()->subDays(7),
                $days->first()->copy(),
            ])
            ->count();

        return [
            'series' => $series,
            'totalCheckIns' => $totalCheckIns,
            'totalDenied' => $series->sum('denied'),
            'changeVsLastWeek' => $this->percentChange($previousWeekCheckIns, $totalCheckIns),
        ];
    }

    private function liveActivity()
    {
        return Attendance::with(['user:id,name'])
            ->orderByDesc('scanned_at')
            ->limit(8)
            ->get()
            ->map(function (Attendance $a) {
                $time = $a->scanned_at->timezone(self::TZ);

                return [
                    'id' => $a->id,
                    'name' => $a->user->name ?? 'Unrecognized code',
                    'initials' => $a->user ? $this->initials($a->user->name) : '?',
                    'status' => $a->status,
                    'reason' => $a->denial_reason,
                    'method' => $a->method === 'manual' ? 'Manual check-in' : 'QR scan',
                    'time' => $time->format('g:i A'),
                    'isToday' => $time->isToday(),
                ];
            });
    }

    private function initials(string $name): string
    {
        return collect(explode(' ', trim($name)))
            ->filter()
            ->map(fn($p) => strtoupper(substr($p, 0, 1)))
            ->take(2)
            ->implode('') ?: '?';
    }
}
