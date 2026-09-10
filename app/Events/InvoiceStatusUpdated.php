<?php

namespace App\Events;

use App\Models\Invoice;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InvoiceStatusUpdated implements ShouldBroadcast
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  public function __construct(public Invoice $invoice) {}

  public function broadcastOn(): array
  {
    return [
      new PrivateChannel('admin.payments'),
    ];
  }

  public function broadcastAs(): string
  {
    return 'invoice.status.updated';
  }

  public function broadcastWith(): array
  {
    return [
      'invoice_id' => $this->invoice->id,
      'status' => $this->invoice->status,
    ];
  }
}
