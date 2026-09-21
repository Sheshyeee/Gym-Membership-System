<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Notifications\Notification as NotificationClass;
use Illuminate\Support\Facades\Notification;

class StaffAlert
{
  /**
   * Send a notification to every staff and admin user.
   */
  public static function send(NotificationClass $notification): void
  {
    $recipients = User::role(['staff', 'admin'])->get();

    if ($recipients->isEmpty()) {
      return;
    }

    Notification::send($recipients, $notification);
  }
}
