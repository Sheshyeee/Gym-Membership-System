<?php
// app/Notifications/StaffNewSubscriptionCreated.php

namespace App\Notifications;

use App\Models\Subscription;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class StaffNewSubscriptionCreated extends Notification
{
  public function __construct(protected Subscription $subscription) {}

  public function via($notifiable): array
  {
    return ['database', 'broadcast'];
  }

  public function toArray($notifiable): array
  {
    $member = $this->subscription->user;
    $plan = $this->subscription->plan?->name ?? 'a plan';

    return [
      'type' => 'staff_new_subscription',
      'title' => 'New subscription',
      'body' => "{$member?->name} subscribed to {$plan}.",
      'user_id' => $member?->id,
    ];
  }

  public function toBroadcast($notifiable): BroadcastMessage
  {
    return new BroadcastMessage($this->toArray($notifiable));
  }
}
