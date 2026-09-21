<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Models\User;
use App\Notifications\MembershipExpired;
use App\Notifications\MembershipExpiring;
use App\Notifications\StaffMembershipExpiring;
use App\Support\StaffAlert;
use Illuminate\Console\Command;

class CheckSubscriptionExpiry extends Command
{
  protected $signature = 'subscriptions:check-expiry';
  protected $description = 'Notify members whose subscription is expiring soon or has just expired';

  // Warn at these day-marks; adjust to taste.
  protected array $warnAtDays = [7, 3, 1];

  public function handle(): void
  {
    $active = Subscription::where('status', 'active')
      ->whereNotNull('current_period_end')
      ->with('user')
      ->get();

    foreach ($active as $subscription) {
      $daysLeft = (int) now()->startOfDay()->diffInDays($subscription->current_period_end->startOfDay(), false);

      if ($daysLeft < 0) {
        // Already past due — flip to expired once, notify once.
        $subscription->update(['status' => 'expired']);
        $subscription->user->notify(new MembershipExpired($subscription));
        continue;
      }

      if (in_array($daysLeft, $this->warnAtDays, true)) {
        // Guard against sending the same day-mark twice if the command
        // runs more than once a day — check today's notifications first.
        $alreadySent = $subscription->user->notifications()
          ->where('type', MembershipExpiring::class)
          ->whereDate('created_at', now()->toDateString())
          ->exists();

        if (! $alreadySent) {
          $subscription->user->notify(new MembershipExpiring($subscription, $daysLeft));
        }

        if (! $this->staffAlreadyNotified($subscription)) {
          StaffAlert::send(new StaffMembershipExpiring($subscription, $daysLeft));
        }
      }
    }
  }

  /**
   * Staff/admin notifications go to multiple recipients, so we can't dedupe
   * against a single user's notifications like the member-facing check above.
   * Instead, check whether ANY staff/admin already got today's alert for
   * this specific subscription, using the subscription_id embedded in the
   * notification's data payload.
   */
  protected function staffAlreadyNotified(Subscription $subscription): bool
  {
    return User::role(['staff', 'admin'])
      ->whereHas('notifications', function ($q) use ($subscription) {
        $q->where('type', StaffMembershipExpiring::class)
          ->whereDate('created_at', now()->toDateString())
          ->where('data', 'like', '%"subscription_id":' . $subscription->id . '%');
      })
      ->exists();
  }
}
