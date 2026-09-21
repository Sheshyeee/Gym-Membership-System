<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class StaffMemberController extends Controller
{
    private const PER_PAGE = 5;

    public function index(Request $request): Response
    {
        // ...unchanged, keep exactly as-is...
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $page = max(1, $request->integer('page', 1));

        $users = User::query()
            ->role('user')
            ->with(['latestSubscription.plan'])
            ->when($search, fn($q) => $q->where(fn($q2) => $q2
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")))
            ->latest()
            ->get();

        $transformed = $users->map(fn(User $user) => $this->transform($user));

        $statusCounts = [
            'all' => $transformed->count(),
            'active' => $transformed->where('status', 'active')->count(),
            'expiring_soon' => $transformed->where('status', 'expiring_soon')->count(),
            'expired' => $transformed->where('status', 'expired')->count(),
        ];

        if ($status && $status !== 'all') {
            $transformed = $transformed->filter(fn($row) => $row['status'] === $status)->values();
        }

        $total = $transformed->count();
        $items = $transformed->forPage($page, self::PER_PAGE)->values();

        $paginated = new LengthAwarePaginator(
            $items,
            $total,
            self::PER_PAGE,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('staffs/members', [
            'members' => $paginated,
            'filters' => ['search' => $search ?: null, 'status' => $status ?: 'all'],
            'statusCounts' => $statusCounts,
        ]);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($this->buildProfilePayload($user));
    }

    public function checkin(Request $request, User $user): JsonResponse
    {
        $staff = $request->user();

        // Same 5-minute duplicate guard used by the QR scanner.
        $recent = Attendance::where('user_id', $user->id)
            ->where('status', 'success')
            ->where('scanned_at', '>=', now()->subMinutes(5))
            ->orderByDesc('scanned_at')
            ->first();

        if ($recent) {
            return response()->json(array_merge($this->buildProfilePayload($user), [
                'checkin' => [
                    'result' => 'duplicate',
                    'message' => 'Already checked in ' . $recent->scanned_at->diffForHumans() . '.',
                ],
            ]));
        }

        if (! $user->isActive()) {
            Attendance::create([
                'user_id' => $user->id,
                'staff_id' => $staff->id,
                'status' => 'denied',
                'denial_reason' => 'Account Deactivated',
                'method' => 'manual',
                'scanned_at' => now(),
            ]);

            return response()->json(array_merge($this->buildProfilePayload($user), [
                'checkin' => ['result' => 'denied', 'message' => 'This member is deactivated.'],
            ]));
        }

        if (! $user->hasActiveSubscription()) {
            Attendance::create([
                'user_id' => $user->id,
                'staff_id' => $staff->id,
                'status' => 'denied',
                'denial_reason' => 'Membership Expired',
                'method' => 'manual',
                'scanned_at' => now(),
            ]);

            return response()->json(array_merge($this->buildProfilePayload($user), [
                'checkin' => ['result' => 'denied', 'message' => 'This member\'s plan is not active.'],
            ]));
        }

        Attendance::create([
            'user_id' => $user->id,
            'staff_id' => $staff->id,
            'status' => 'success',
            'method' => 'manual',
            'scanned_at' => now(),
        ]);

        return response()->json(array_merge($this->buildProfilePayload($user), [
            'checkin' => ['result' => 'success', 'message' => 'Checked in successfully.'],
        ]));
    }

    private function buildProfilePayload(User $user): array
    {
        $user->loadMissing(['subscriptions.plan', 'subscriptions.invoices']);

        $latestSubscription = $user->subscriptions->sortByDesc('created_at')->first();

        $payments = $user->subscriptions
            ->flatMap(fn($sub) => $sub->invoices)
            ->sortByDesc('created_at')
            ->values()
            ->map(fn($invoice) => [
                'id' => $invoice->id,
                'amount' => number_format($invoice->amount / 100, 2),
                'status' => $invoice->status,
                'date' => optional($invoice->paid_at ?? $invoice->due_at)->format('M j, Y \a\t g:i A'),
            ]);

        $planHistory = $user->subscriptions
            ->sortByDesc('created_at')
            ->values()
            ->map(fn($sub) => [
                'id' => $sub->id,
                'plan' => $sub->plan?->name,
                'price' => $sub->plan
                    ? number_format(
                        ($sub->billing_cycle === 'annual' ? $sub->plan->annual_price : $sub->plan->monthly_price) / 100,
                        2
                    )
                    : null,
                'started_at' => optional($sub->current_period_start ?? $sub->created_at)->format('M j, Y'),
            ]);

        $successfulAttendances = Attendance::where('user_id', $user->id)
            ->where('status', 'success')
            ->orderByDesc('scanned_at')
            ->get();

        $now = Carbon::now();
        $lastCheckIn = $successfulAttendances->first();

        return [
            'id' => $user->id,
            'code' => 'MEM-' . str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'joined_at' => $user->created_at->format('F j, Y'),
            'plan' => $latestSubscription?->plan?->name,
            'status' => $this->resolveStatus($latestSubscription),
            'valid_until' => optional($latestSubscription?->current_period_end)->format('M j, Y'),
            'monthly_visits' => $successfulAttendances->filter(
                fn($a) => $a->scanned_at->isSameMonth($now)
            )->count(),
            'last_check_in' => $lastCheckIn?->scanned_at?->format('M j, Y \a\t g:i A'),
            'avg_visits_per_week' => $this->computeAvgVisitsPerWeek($successfulAttendances, $user->created_at),
            'streak_days' => $this->computeStreak($successfulAttendances),
            'attendance_history' => $successfulAttendances->take(30)->map(fn($a) => [
                'id' => $a->id,
                'date_label' => $this->dateLabel($a->scanned_at),
                'time' => $a->scanned_at->format('g:i A'),
                'method_label' => $a->method === 'manual' ? 'Front desk' : 'QR scanner',
            ])->values(),
            'plan_history' => $planHistory,
            'payments' => $payments,
        ];
    }

    private function transform(User $user): array
    {
        $subscription = $user->latestSubscription;

        return [
            'id' => $user->id,
            'code' => 'MEM-' . str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
            'name' => $user->name,
            'email' => $user->email,
            'plan' => $subscription?->plan?->name,
            'status' => $this->resolveStatus($subscription),
            'valid_until' => optional($subscription?->current_period_end)->format('M j, Y'),
            'last_visit' => null,
            'visits' => null,
        ];
    }

    private function resolveStatus(?Subscription $subscription): string
    {
        if (! $subscription || ! $subscription->current_period_end) {
            return 'expired';
        }

        if ($subscription->cancelled_at) {
            return 'expired';
        }

        $end = Carbon::parse($subscription->current_period_end);

        if ($end->isPast()) {
            return 'expired';
        }

        if ($end->isBefore(now()->addDays(14))) {
            return 'expiring_soon';
        }

        return 'active';
    }

    private function dateLabel(Carbon $date): string
    {
        if ($date->isToday()) {
            return 'Today';
        }

        if ($date->isYesterday()) {
            return 'Yesterday';
        }

        return $date->format('M j');
    }

    private function computeStreak(Collection $attendances): int
    {
        if ($attendances->isEmpty()) {
            return 0;
        }

        $days = $attendances->map(fn($a) => $a->scanned_at->toDateString())->unique()->values();
        $mostRecent = Carbon::parse($days->first());

        // Streak is only "alive" if the last check-in was today or yesterday.
        if ($mostRecent->lt(Carbon::today()->subDay())) {
            return 0;
        }

        $streak = 0;
        $expected = $mostRecent->copy();

        foreach ($days as $day) {
            $d = Carbon::parse($day);

            if ($d->equalTo($expected)) {
                $streak++;
                $expected = $expected->copy()->subDay();
            } else {
                break;
            }
        }

        return $streak;
    }

    private function computeAvgVisitsPerWeek(Collection $attendances, ?Carbon $joinedAt): int
    {
        if ($attendances->isEmpty()) {
            return 0;
        }

        $windowWeeks = 4;

        if ($joinedAt && $joinedAt->gt(now()->subWeeks($windowWeeks))) {
            $windowWeeks = max(1, $joinedAt->diffInWeeks(now()));
        }

        $count = $attendances->filter(
            fn($a) => $a->scanned_at->gte(now()->subWeeks($windowWeeks))
        )->count();

        return (int) round($count / $windowWeeks);
    }
}
