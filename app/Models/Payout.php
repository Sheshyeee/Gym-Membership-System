<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payout extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'status',
        'amount',
        'net_amount',
        'fee',
        'tax_amount',
        'adjustment_amount',
        'refund_amount',
        'dispute_amount',
        'currency',
        'provider',
        'settlement_bank_name',
        'settlement_account_number',
        'transfer_status',
        'transfer_reference_number',
        'description',
        'paymongo_created_at',
        'status_updated_at',
        'raw_payload',
    ];

    protected $casts = [
        'paymongo_created_at' => 'datetime',
        'status_updated_at' => 'datetime',
        'raw_payload' => 'array',
    ];
}
