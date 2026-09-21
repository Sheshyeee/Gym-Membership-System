<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\User;
use App\Notifications\StaffCheckInDenied;
use App\Support\StaffAlert;

class AttendanceCheckInService
{
  /**
   * Runs the shared check-in rules (duplicate window, active account,
   * active subscription) and logs the resulting Attendance row.
   */
  public function checkIn(User $member, User $staff, string $method = 'manual'): array
  {
    $recent = Attendance::where('user_id', $member->id)
      ->where('status', 'success')
      ->where('scanned_at', '>=', now()->subMinutes(5))
      ->orderByDesc('scanned_at')
      ->first();

    if ($recent) {
      return [
        'result' => 'duplicate',
        'message' => 'Already checked in ' . $recent->scanned_at->diffForHumans() . '.',
      ];
    }

    if (! $member->isActive()) {
      $attendance = Attendance::create([
        'user_id' => $member->id,
        'staff_id' => $staff->id,
        'status' => 'denied',
        'denial_reason' => 'Account Deactivated',
        'method' => $method,
        'scanned_at' => now(),
      ]);

      StaffAlert::send(new StaffCheckInDenied($attendance));

      return ['result' => 'denied', 'message' => 'This member is deactivated.'];
    }

    $subscription = $member->activeSubscription()->first();

    $membershipValid = $subscription
      && ! $subscription->cancelled_at
      && (! $subscription->current_period_end || $subscription->current_period_end->isFuture());

    if (! $membershipValid) {
      $attendance = Attendance::create([
        'user_id' => $member->id,
        'staff_id' => $staff->id,
        'status' => 'denied',
        'denial_reason' => 'Membership Expired',
        'method' => $method,
        'scanned_at' => now(),
      ]);

      StaffAlert::send(new StaffCheckInDenied($attendance));

      return ['result' => 'denied', 'message' => 'This member\'s plan is not active.'];
    }

    Attendance::create([
      'user_id' => $member->id,
      'staff_id' => $staff->id,
      'status' => 'success',
      'method' => $method,
      'scanned_at' => now(),
    ]);

    return ['result' => 'success', 'message' => 'Checked in successfully.'];
  }
}
