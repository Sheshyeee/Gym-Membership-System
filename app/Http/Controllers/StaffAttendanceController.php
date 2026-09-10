<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class StaffAttendanceController extends Controller
{
    public function index(Request $request)
    {
        $range = $request->get('range', 'today');
        $date = $request->get('date');

        [$rangeStart, $rangeEnd] = match ($range) {
            'week' => [now()->startOfWeek(), now()->endOfWeek()],
            'month' => [now()->startOfMonth(), now()->endOfMonth()],
            default => [now()->startOfDay(), now()->endOfDay()],
        };

        // Column is stored in UTC, so convert the local range boundaries to UTC
        // before querying, then work with the already-timezone-corrected
        // scanned_at Carbon instances for any hour/day grouping.
        $utcStart = $rangeStart->copy()->utc();
        $utcEnd = $rangeEnd->copy()->utc();

        $scoped = fn() => Attendance::whereBetween('scanned_at', [$utcStart, $utcEnd]);

        $totalVisits = $scoped()->where('status', 'success')->count();
        $deniedCount = $scoped()->where('status', 'denied')->count();

        $successRows = $scoped()->where('status', 'success')->get(['id', 'scanned_at']);

        $busiest = $successRows
            ->groupBy(fn($a) => $a->scanned_at->toDateString())
            ->map(fn($group, $day) => ['day' => $day, 'total' => $group->count()])
            ->sortByDesc('total')
            ->first();

        $hourly = $successRows
            ->groupBy(fn($a) => (int) $a->scanned_at->format('G'))
            ->map(fn($group, $hour) => [
                'hour' => Carbon::createFromTime($hour)->format('g A'),
                'total' => $group->count(),
            ])
            ->sortByDesc('total')
            ->take(3)
            ->values();

        if ($range === 'today') {
            $counts = $successRows->countBy(fn($a) => (int) $a->scanned_at->format('G'));

            $chartData = collect(range(0, 23))->map(fn($hour) => [
                'label' => Carbon::createFromTime($hour)->format('gA'),
                'total' => (int) ($counts[$hour] ?? 0),
            ])->values();
        } else {
            $counts = $successRows->countBy(fn($a) => $a->scanned_at->toDateString());

            $chartData = collect();
            $cursor = $rangeStart->copy()->startOfDay();
            $end = $rangeEnd->copy()->startOfDay();
            while ($cursor->lte($end)) {
                $key = $cursor->toDateString();
                $chartData->push([
                    'label' => $cursor->format('M j'),
                    'total' => (int) ($counts[$key] ?? 0),
                ]);
                $cursor->addDay();
            }
        }

        $recentQuery = Attendance::with(['user.activeSubscription.plan'])
            ->orderByDesc('scanned_at');

        if ($date) {
            $dayStart = Carbon::parse($date)->startOfDay()->utc();
            $dayEnd = Carbon::parse($date)->endOfDay()->utc();
            $recentQuery->whereBetween('scanned_at', [$dayStart, $dayEnd]);
        } else {
            $recentQuery->whereBetween('scanned_at', [$utcStart, $utcEnd]);
        }

        $recentVisits = $recentQuery->limit(25)->get()->map(fn($v) => [
            'id' => $v->id,
            'name' => $v->user?->name ?? 'Unknown',
            'initials' => $v->user
                ? collect(explode(' ', $v->user->name))->map(fn($p) => strtoupper(substr($p, 0, 1)))->take(2)->implode('')
                : '?',
            'status' => $v->status,
            'denialReason' => $v->denial_reason,
            'plan' => $v->user?->activeSubscription?->plan?->name,
            'time' => $v->scanned_at->format('g:i A'),
            'date' => $v->scanned_at->isToday()
                ? 'Today'
                : ($v->scanned_at->isYesterday() ? 'Yesterday' : $v->scanned_at->format('M j')),
        ]);

        return inertia('staffs/attendance', [
            'range' => $range,
            'filterDate' => $date,
            'stats' => [
                'totalVisits' => $totalVisits,
                'deniedCount' => $deniedCount,
                'busiestDay' => $busiest ? Carbon::parse($busiest['day'])->format('l') : '—',
                'busiestDayCount' => $busiest['total'] ?? 0,
                'peakHour' => $hourly->first()['hour'] ?? '—',
                'peakHours' => $hourly,
            ],
            'chartData' => $chartData,
            'recentVisits' => $recentVisits,
        ]);
    }
}
