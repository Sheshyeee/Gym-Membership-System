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
            ? Carbon::parse($request->string('hourly_date')->toString())->startOfDay()
            : now()->startOfDay();

        $weekOffset = (int) $request->integer('week_offset', 0);
        $weekStart = now()->startOfWeek(Carbon::MONDAY)->addWeeks($weekOffset);
        $weekEnd = (clone $weekStart)->endOfWeek(Carbon::SUNDAY);

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
            'recentRecords' => fn() => $this->recentRecords(),
        ]);
    }

    private function stats(): array
    {
        $rangeStart = now()->subDays(30);

        $totalCheckIns = Attendance::where('status', 'success')
            ->where('scanned_at', '>=', $rangeStart)
            ->count();

        $peakHourRow = Attendance::where('status', 'success')
            ->where('scanned_at', '>=', $rangeStart)
            ->selectRaw('HOUR(scanned_at) as hour, COUNT(*) as total')
            ->groupBy('hour')
            ->orderByDesc('total')
            ->first();

        $peakHourMembers = 0;
        if ($peakHourRow) {
            $peakHourMembers = Attendance::where('status', 'success')
                ->where('scanned_at', '>=', $rangeStart)
                ->whereRaw('HOUR(scanned_at) = ?', [$peakHourRow->hour])
                ->distinct('user_id')
                ->count('user_id');
        }

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
            'peakHour' => $peakHourRow
                ? Carbon::createFromTime((int) $peakHourRow->hour)->format('g A')
                : '—',
            'peakHourMembers' => $peakHourMembers,
            'activeMembers' => $activeMembers,
        ];
    }

    private function hourlyData(CarbonInterface $date): array
    {
        $rows = Attendance::where('status', 'success')
            ->whereBetween('scanned_at', [$date->copy()->startOfDay(), $date->copy()->endOfDay()])
            ->selectRaw('HOUR(scanned_at) as hour, COUNT(*) as total')
            ->groupBy('hour')
            ->get()
            ->keyBy('hour');

        return collect(range(0, 23))->map(fn($hour) => [
            'label' => Carbon::createFromTime($hour)->format('gA'),
            'total' => (int) ($rows->get($hour)->total ?? 0),
        ])->values()->all();
    }

    private function heatmapData(CarbonInterface $weekStart, CarbonInterface $weekEnd): array
    {
        $rows = Attendance::where('status', 'success')
            ->whereBetween('scanned_at', [$weekStart, $weekEnd])
            ->selectRaw('DAYOFWEEK(scanned_at) as dow, HOUR(scanned_at) as hour, COUNT(*) as total')
            ->groupBy('dow', 'hour')
            ->get();

        // MySQL DAYOFWEEK: 1=Sun..7=Sat. Convert to Mon-first index 0..6.
        $counts = [];
        foreach ($rows as $row) {
            $dayIndex = ((int) $row->dow + 5) % 7;
            foreach (self::HEATMAP_BUCKETS as $bIndex => $bucket) {
                if ($row->hour >= $bucket['start'] && $row->hour < $bucket['end']) {
                    $counts[$dayIndex][$bIndex] = ($counts[$dayIndex][$bIndex] ?? 0) + $row->total;
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

    private function recentRecords(): array
    {
        return Attendance::with('user.activeSubscription.plan')
            ->orderByDesc('scanned_at')
            ->limit(25)
            ->get()
            ->map(fn(Attendance $a) => [
                'id' => $a->id,
                'name' => $a->user?->name ?? 'Unknown',
                'status' => $a->status,
                'denialReason' => $a->denial_reason,
                'plan' => $a->user?->activeSubscription?->plan?->name,
                'time' => $a->scanned_at->format('g:i A'),
                'date' => $a->scanned_at->isToday()
                    ? 'Today'
                    : ($a->scanned_at->isYesterday() ? 'Yesterday' : $a->scanned_at->format('M j')),
            ])
            ->values()
            ->all();
    }
}
