<?php

namespace App\Notifications;

use App\Models\Subscription;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class MembershipExpired extends Notification
{
    public function __construct(protected Subscription $subscription) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'membership_expired',
            'title' => 'Your membership has expired',
            'body' => 'Renew now to get your access back.',
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}