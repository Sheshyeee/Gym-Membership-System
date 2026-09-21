<?php
// app/Notifications/StaffPaymentFailed.php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class StaffPaymentFailed extends Notification
{
  public function __construct(protected Invoice $invoice) {}

  public function via($notifiable): array
  {
    return ['database', 'broadcast'];
  }

  public function toArray($notifiable): array
  {
    $member = $this->invoice->subscription?->user;
    $amount = number_format($this->invoice->amount / 100, 2);

    return [
      'type' => 'staff_payment_failed',
      'title' => 'Payment failed',
      'body' => ($member?->name ?? 'A member') . "'s payment of ₱{$amount} failed.",
      'invoice_id' => $this->invoice->id,
    ];
  }

  public function toBroadcast($notifiable): BroadcastMessage
  {
    return new BroadcastMessage($this->toArray($notifiable));
  }
}
