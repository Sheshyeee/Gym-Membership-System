<?php
// app/Notifications/StaffNewMemberRegistered.php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class StaffNewMemberRegistered extends Notification
{
  public function __construct(protected User $member) {}

  public function via($notifiable): array
  {
    return ['database', 'broadcast'];
  }

  public function toArray($notifiable): array
  {
    return [
      'type' => 'staff_new_member',
      'title' => 'New member signed up',
      'body' => "{$this->member->name} just created an account.",
      'user_id' => $this->member->id,
    ];
  }

  public function toBroadcast($notifiable): BroadcastMessage
  {
    return new BroadcastMessage($this->toArray($notifiable));
  }
}
