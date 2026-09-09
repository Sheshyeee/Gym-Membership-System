<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\Request;

class StaffCheckInsController extends Controller
{
    public function index(Request $request)
    {
        return inertia('staffs/QR-checkin');
    }

    public function scan(Request $request)
    {
        $request->validate(['token' => 'required|string']);

        $staff = $request->user();
        $token = $request->token;

        $user = User::where('qr_token', $token)->first();

        if (! $user) {
            Attendance::create([
                'staff_id' => $staff->id,
                'status' => 'denied',
                'denial_reason' => 'Invalid QR Code',
                'scanned_token' => $token,
                'scanned_at' => now(),
            ]);

            return response()->json([
                'result' => 'denied',
                'reason' => 'Invalid QR Code',
                'message' => 'This code was not recognized.',
            ]);
        }

        if (! $user->isActive()) {
            Attendance::create([
                'user_id' => $user->id,
                'staff_id' => $staff->id,
                'status' => 'denied',
                'denial_reason' => 'Account Deactivated',
                'scanned_token' => $token,
                'scanned_at' => now(),
            ]);

            return response()->json([
                'result' => 'denied',
                'reason' => 'Account Deactivated',
                'message' => 'Ask the member to contact the front desk.',
                'member' => $this->memberPayload($user),
            ]);
        }

        $subscription = $user->activeSubscription()->with('plan')->first();

        if (! $subscription) {
            Attendance::create([
                'user_id' => $user->id,
                'staff_id' => $staff->id,
                'status' => 'denied',
                'denial_reason' => 'Membership Expired',
                'scanned_token' => $token,
                'scanned_at' => now(),
            ]);

            return response()->json([
                'result' => 'denied',
                'reason' => 'Membership Expired',
                'message' => 'Ask the member to renew their plan at the front desk.',
                'member' => $this->memberPayload($user),
            ]);
        }

        $attendance = Attendance::create([
            'user_id' => $user->id,
            'staff_id' => $staff->id,
            'status' => 'success',
            'scanned_token' => $token,
            'scanned_at' => now(),
        ]);

        return response()->json([
            'result' => 'success',
            'member' => $this->memberPayload($user, $subscription->plan?->name),
            'scannedAt' => $attendance->scanned_at->format('g:i A'),
        ]);
    }

    private function memberPayload(User $user, ?string $planName = null): array
    {
        return [
            'name' => $user->name,
            'initials' => collect(explode(' ', $user->name))
                ->map(fn($p) => strtoupper(substr($p, 0, 1)))
                ->take(2)
                ->implode(''),
            'plan' => $planName,
        ];
    }
}
