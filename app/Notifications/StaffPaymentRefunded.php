<?php
// app/Notifications/StaffPaymentRefunded.php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class StaffPaymentRefunded extends Notification
{
  public function __construct(protected Invoice $invoice) {}

  public function via($notifiable): array
  {
    return ['database', 'broadcast'];
  }

  public function toArray($notifiable): array
  {
    $member = $this->invoice->subscription?->user;
    $amount = number_format(($this->invoice->refund_amount ?? $this->invoice->amount) / 100, 2);

    return [
      'type' => 'staff_payment_refunded',
      'title' => 'Refund processed',
      'body' => "₱{$amount} refunded to " . ($member?->name ?? 'a member') . '.',
      'invoice_id' => $this->invoice->id,
    ];
  }

  public function toBroadcast($notifiable): BroadcastMessage
  {
    return new BroadcastMessage($this->toArray($notifiable));
  }
}
