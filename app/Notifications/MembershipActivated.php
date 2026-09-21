<?php

namespace App\Notifications;

use App\Models\Subscription;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class MembershipActivated extends Notification
{
  public function __construct(protected Subscription $subscription) {}

  public function via($notifiable): array
  {
    return ['database', 'broadcast'];
  }

  public function toArray($notifiable): array
  {
    $days = $this->subscription->current_period_end
      ? (int) now()->diffInDays($this->subscription->current_period_end)
      : 0;

    return [
      'type' => 'membership_activated',
      'title' => 'Your membership is active',
      'body' => "Payment received. You have {$days} days of access ahead.",
    ];
  }

  public function toBroadcast($notifiable): BroadcastMessage
  {
    return new BroadcastMessage($this->toArray($notifiable));
  }
}
