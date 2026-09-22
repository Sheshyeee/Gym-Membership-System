<?php

namespace App\Events;

use App\Models\Payout;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PayoutStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Payout $payout) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('admin.payments')];
    }

    public function broadcastAs(): string
    {
        return 'payout.status.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'payout_id' => $this->payout->id,
            'status' => $this->payout->status,
        ];
    }
}
