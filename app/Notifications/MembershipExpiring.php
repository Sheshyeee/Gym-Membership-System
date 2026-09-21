<?php

namespace App\Notifications;

use App\Models\Subscription;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class MembershipExpiring extends Notification
{
  public function __construct(protected Subscription $subscription, protected int $daysLeft) {}

  public function via($notifiable): array
  {
    return ['database', 'broadcast'];
  }

  public function toArray($notifiable): array
  {
    return [
      'type' => 'membership_expiring',
      'title' => 'Your membership is about to expire',
      'body' => "Only {$this->daysLeft} day(s) left — renew to avoid losing access.",
    ];
  }

  public function toBroadcast($notifiable): BroadcastMessage
  {
    return new BroadcastMessage($this->toArray($notifiable));
  }
}
