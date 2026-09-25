<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Subscription;
use App\Models\User;
use App\Services\AttendanceCheckInService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class StaffManualCheckInController extends Controller
{
    public function __construct(protected AttendanceCheckInService $checkInService) {}

    public function index(Request $request)
    {
        return inertia('staffs/manual-checkin', [
            'recentCheckIns' => $this->recentCheckIns(),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('q', ''));

        if ($query === '') {
            return response()->json(['results' => []]);
        }

        $users = User::query()
            ->role('user')
            ->with('latestSubscription.plan')
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%");

                // Also allow matching by member code / raw id, e.g. "MEM-0042" or "42"
                if (preg_match('/(\d+)/', $query, $m)) {
                    $q->orWhere('id', (int) $m[1]);
                }
            })
            ->limit(8)
            ->get();

        $results = $users->map(fn(User $user) => [
            'id' => $user->id,
            'code' => 'MEM-' . str_pad((string) $user->id, 5, '0', STR_PAD_LEFT),
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'plan' => $user->latestSubscription?->plan?->name,
            'status' => $this->resolveStatus($user->latestSubscription),
            'is_active' => $user->isActive(),
        ]);

        return response()->json(['results' => $results]);
    }

    public function checkin(Request $request, User $user): JsonResponse
    {
        $result = $this->checkInService->checkIn($user, $request->user());

        return response()->json([
            'checkin' => $result,
            'member' => [
                'id' => $user->id,
                'name' => $user->name,
                'code' => 'MEM-' . str_pad((string) $user->id, 5, '0', STR_PAD_LEFT),
            ],
            'recentCheckIns' => $this->recentCheckIns(),
        ]);
    }

    private function recentCheckIns()
    {
        return Attendance::with('user:id,name,avatar')
            ->where('status', 'success')
            ->whereDate('scanned_at', Carbon::today())
            ->orderByDesc('scanned_at')
            ->limit(10)
            ->get()
            ->map(fn(Attendance $a) => [
                'id' => $a->id,
                'user_id' => $a->user_id,
                'name' => $a->user->name ?? 'Unknown',
                'avatar' => $a->user->avatar ?? null,
                'time' => $a->scanned_at->timezone('Asia/Manila')->format('g:i A'),
            ]);
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
}
