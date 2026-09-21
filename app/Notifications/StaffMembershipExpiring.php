<?php
// app/Notifications/StaffMembershipExpiring.php

namespace App\Notifications;

use App\Models\Subscription;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class StaffMembershipExpiring extends Notification
{
  public function __construct(protected Subscription $subscription, protected int $daysLeft) {}

  public function via($notifiable): array
  {
    return ['database', 'broadcast'];
  }

  public function toArray($notifiable): array
  {
    $member = $this->subscription->user;

    return [
      'type' => 'staff_membership_expiring',
      'title' => 'Member plan expiring soon',
      'body' => "{$member?->name}'s membership expires in {$this->daysLeft} day(s).",
      'user_id' => $member?->id,
      'subscription_id' => $this->subscription->id,
    ];
  }

  public function toBroadcast($notifiable): BroadcastMessage
  {
    return new BroadcastMessage($this->toArray($notifiable));
  }
}
