<?php
// app/Notifications/StaffCheckInDenied.php

namespace App\Notifications;

use App\Models\Attendance;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class StaffCheckInDenied extends Notification
{
  public function __construct(protected Attendance $attendance) {}

  public function via($notifiable): array
  {
    return ['database', 'broadcast'];
  }

  public function toArray($notifiable): array
  {
    $member = $this->attendance->user;
    $name = $member?->name ?? 'Unknown member';
    $reason = $this->attendance->denial_reason ?? 'Access denied';

    return [
      'type' => 'staff_checkin_denied',
      'title' => 'Check-in denied',
      'body' => "{$name} was denied entry — {$reason}.",
      'user_id' => $member?->id,
      'attendance_id' => $this->attendance->id,
    ];
  }

  public function toBroadcast($notifiable): BroadcastMessage
  {
    return new BroadcastMessage($this->toArray($notifiable));
  }
}
