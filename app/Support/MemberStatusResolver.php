<?php

namespace App\Support;

use App\Models\Subscription;
use Illuminate\Support\Carbon;

/**
 * Every dashboard (Members, Overview, Attendance) needs to agree on what
 * "active" / "expiring soon" / "expired" means for a member. This mirrors
 * AdminMemberController::resolveStatus() exactly so the numbers never
 * drift between pages again — if the definition changes, change it here.
 */
class MemberStatusResolver
{
  public const EXPIRING_SOON_DAYS = 14;

  public static function resolve(?Subscription $subscription): string
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

    if ($end->isBefore(now()->addDays(self::EXPIRING_SOON_DAYS))) {
      return 'expiring_soon';
    }

    return 'active';
  }

  /**
   * "Currently subscribed" = active or expiring soon. This is what the
   * attendance dashboard's "Active members" count really means (it isn't
   * just the narrower "active" bucket from the donut breakdown).
   */
  public static function isCurrentlySubscribed(?Subscription $subscription): bool
  {
    return in_array(self::resolve($subscription), ['active', 'expiring_soon'], true);
  }
}
