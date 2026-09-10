<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AdminAttendanceController extends Controller
{
    // Display timezone. Storage stays UTC (config('app.timezone')) — only
    // convert here, at the edges, so historical UTC data stays correct.
    private const DISPLAY_TZ = 'Asia/Manila';

    private const HEATMAP_BUCKETS = [
        ['label' => '6–8 AM', 'start' => 6, 'end' => 8],
        ['label' => '8–10 AM', 'start' => 8, 'end' => 10],
        ['label' => '10–12 PM', 'start' => 10, 'end' => 12],
        ['label' => '12–2 PM', 'start' => 12, 'end' => 14],
        ['label' => '2–4 PM', 'start' => 14, 'end' => 16],
        ['label' => '4–6 PM', 'start' => 16, 'end' => 18],
        ['label' => '6–8 PM', 'start' => 18, 'end' => 20],
    ];

    public function index(Request $request): Response
    {
        $hourlyDate = $request->filled('hourly_date')
            ? Carbon::parse($request->string('hourly_date')->toString(), self::DISPLAY_TZ)->startOfDay()
            : Carbon::now(self::DISPLAY_TZ)->startOfDay();

        $weekOffset = (int) $request->integer('week_offset', 0);
        $weekStart = Carbon::now(self::DISPLAY_TZ)->startOfWeek(Carbon::MONDAY)->addWeeks($weekOffset);
        $weekEnd = (clone $weekStart)->endOfWeek(Carbon::SUNDAY);

        $recordDate = $request->filled('record_date')
            ? $request->string('record_date')->toString()
            : null;

        return Inertia::render('admin/attendance', [
            'stats' => fn() => $this->stats(),
            'hourly' => fn() => [
                'date' => $hourlyDate->toDateString(),
                'data' => $this->hourlyData($hourlyDate),
            ],
            'heatmap' => fn() => [
                'weekOffset' => $weekOffset,
                'weekLabel' => $weekStart->format('M j') . ' – ' . $weekEnd->format('M j, Y'),
                'isCurrentWeek' => $weekOffset === 0,
                'buckets' => $this->heatmapData($weekStart, $weekEnd),
            ],
            'recordDate' => $recordDate,
            'recentRecords' => fn() => $this->recentRecords($recordDate),
        ]);
    }

    private function stats(): array
    {
        $rangeStart = Carbon::now(self::DISPLAY_TZ)->subDays(30)->utc();

        $rows = Attendance::where('status', 'success')
            ->where('scanned_at', '>=', $rangeStart)
            ->get(['id', 'user_id', 'scanned_at']);

        $totalCheckIns = $rows->count();

        $peak = $rows
            ->groupBy(fn($a) => (int) $a->scanned_at->setTimezone(self::DISPLAY_TZ)->format('G'))
            ->map(fn($group, $hour) => [
                'hour' => $hour,
                'count' => $group->count(),
                'members' => $group->pluck('user_id')->unique()->count(),
            ])
            ->sortByDesc('count')
            ->first();

        $activeMembers = User::role('user')
            ->with('latestSubscription')
            ->get()
            ->filter(function (User $user) {
                $sub = $user->latestSubscription;
                if (! $sub || ! $sub->current_period_end || $sub->cancelled_at) {
                    return false;
                }
                return Carbon::parse($sub->current_period_end)->isFuture();
            })
            ->count();

        return [
            'totalCheckIns' => $totalCheckIns,
            'peakHour' => $peak ? Carbon::createFromTime($peak['hour'])->format('g A') : '—',
            'peakHourMembers' => $peak['members'] ?? 0,
            'activeMembers' => $activeMembers,
        ];
    }

    private function hourlyData(CarbonInterface $date): array
    {
        // $date is already a Manila-local start-of-day; convert to UTC for the query.
        $start = $date->copy()->startOfDay()->utc();
        $end = $date->copy()->endOfDay()->utc();

        $rows = Attendance::where('status', 'success')
            ->whereBetween('scanned_at', [$start, $end])
            ->get(['scanned_at']);

        $counts = $rows->countBy(
            fn($a) => (int) $a->scanned_at->setTimezone(self::DISPLAY_TZ)->format('G')
        );

        return collect(range(0, 23))->map(fn($hour) => [
            'label' => Carbon::createFromTime($hour)->format('gA'),
            'total' => (int) ($counts[$hour] ?? 0),
        ])->values()->all();
    }

    private function heatmapData(CarbonInterface $weekStart, CarbonInterface $weekEnd): array
    {
        $rows = Attendance::where('status', 'success')
            ->whereBetween('scanned_at', [$weekStart->copy()->utc(), $weekEnd->copy()->utc()])
            ->get(['scanned_at']);

        $counts = [];
        foreach ($rows as $row) {
            $local = $row->scanned_at->setTimezone(self::DISPLAY_TZ);
            $dayIndex = $local->dayOfWeekIso - 1; // Mon=0 ... Sun=6
            $hour = (int) $local->format('G');

            foreach (self::HEATMAP_BUCKETS as $bIndex => $bucket) {
                if ($hour >= $bucket['start'] && $hour < $bucket['end']) {
                    $counts[$dayIndex][$bIndex] = ($counts[$dayIndex][$bIndex] ?? 0) + 1;
                }
            }
        }

        $max = 0;
        foreach ($counts as $day) {
            foreach ($day as $v) {
                $max = max($max, $v);
            }
        }

        return collect(self::HEATMAP_BUCKETS)->map(function ($bucket, $bIndex) use ($counts, $max) {
            return [
                'label' => $bucket['label'],
                'cells' => collect(range(0, 6))->map(function ($dIndex) use ($counts, $bIndex, $max) {
                    $count = $counts[$dIndex][$bIndex] ?? 0;
                    return [
                        'count' => $count,
                        'intensity' => $max > 0 ? round($count / $max, 2) : 0,
                    ];
                })->values()->all(),
            ];
        })->values()->all();
    }

    private function recentRecords(?string $date = null): array
    {
        $query = Attendance::with('user.activeSubscription.plan')
            ->orderByDesc('scanned_at');

        if ($date) {
            $start = Carbon::parse($date, self::DISPLAY_TZ)->startOfDay()->utc();
            $end = Carbon::parse($date, self::DISPLAY_TZ)->endOfDay()->utc();
            $query->whereBetween('scanned_at', [$start, $end]);
        }

        return $query->limit(25)->get()
            ->map(function (Attendance $a) {
                $local = $a->scanned_at->setTimezone(self::DISPLAY_TZ);
                return [
                    'id' => $a->id,
                    'name' => $a->user?->name ?? 'Unknown',
                    'status' => $a->status,
                    'denialReason' => $a->denial_reason,
                    'plan' => $a->user?->activeSubscription?->plan?->name,
                    'time' => $local->format('g:i A'),
                    'date' => $local->isToday()
                        ? 'Today'
                        : ($local->isYesterday() ? 'Yesterday' : $local->format('M j')),
                ];
            })
            ->values()
            ->all();
    }
}
