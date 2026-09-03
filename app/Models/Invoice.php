<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = [
        'user_id',
        'subscription_id',
        'plan_id',
        'amount',
        'currency',
        'payment_method_type',
        'status',
        'processor_source_id',
        'processor_payment_intent_id',
        'processor_payment_id',
        'due_at',
        'paid_at',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }
}
