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

        $scoped = fn() => Attendance::whereBetween('scanned_at', [$rangeStart, $rangeEnd]);

        $totalVisits = $scoped()->where('status', 'success')->count();
        $deniedCount = $scoped()->where('status', 'denied')->count();

        $busiest = $scoped()->where('status', 'success')
            ->selectRaw('DATE(scanned_at) as day, COUNT(*) as total')
            ->groupBy('day')
            ->orderByDesc('total')
            ->first();

        $hourly = $scoped()->where('status', 'success')
            ->selectRaw('HOUR(scanned_at) as hour, COUNT(*) as total')
            ->groupBy('hour')
            ->orderByDesc('total')
            ->limit(3)
            ->get()
            ->map(fn($row) => [
                'hour' => Carbon::createFromTime((int) $row->hour)->format('g A'),
                'total' => $row->total,
            ]);

        if ($range === 'today') {
            $chartData = $scoped()->where('status', 'success')
                ->selectRaw('HOUR(scanned_at) as bucket, COUNT(*) as total')
                ->groupBy('bucket')
                ->orderBy('bucket')
                ->get()
                ->map(fn($row) => [
                    'label' => Carbon::createFromTime((int) $row->bucket)->format('g A'),
                    'total' => $row->total,
                ]);
        } else {
            $chartData = $scoped()->where('status', 'success')
                ->selectRaw('DATE(scanned_at) as bucket, COUNT(*) as total')
                ->groupBy('bucket')
                ->orderBy('bucket')
                ->get()
                ->map(fn($row) => [
                    'label' => Carbon::parse($row->bucket)->format('M j'),
                    'total' => $row->total,
                ]);
        }

        $recentQuery = Attendance::with(['user.activeSubscription.plan'])
            ->orderByDesc('scanned_at');

        if ($date) {
            $recentQuery->whereDate('scanned_at', $date);
        } else {
            $recentQuery->whereBetween('scanned_at', [$rangeStart, $rangeEnd]);
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
                'busiestDay' => $busiest ? Carbon::parse($busiest->day)->format('l') : '—',
                'busiestDayCount' => $busiest->total ?? 0,
                'peakHour' => $hourly->first()['hour'] ?? '—',
                'peakHours' => $hourly,
            ],
            'chartData' => $chartData,
            'recentVisits' => $recentVisits,
        ]);
    }
}
