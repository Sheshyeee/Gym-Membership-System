<?php

namespace App\Support;

use App\Models\Payout;
use Illuminate\Support\Facades\Log;

class PayoutRecorder
{
  /**
   * Upsert a local Payout record from a PayMongo payout resource
   * (accepts both the webhook `data` shape and the raw API list/detail shape).
   */
  public static function record(array $resource): ?Payout
  {
    $id = $resource['id'] ?? null;
    $attributes = $resource['attributes'] ?? null;

    if (! $id || ! $attributes) {
      Log::warning('PayoutRecorder: resource missing id or attributes', ['id' => $id]);
      return null;
    }

    $organization = $attributes['organization'] ?? [];
    $lastTransfer = $attributes['last_payout_transfer'] ?? [];

    return Payout::updateOrCreate(
      ['id' => $id],
      [
        'status' => $attributes['status'] ?? 'pending',
        'amount' => $attributes['amount'] ?? 0,
        'net_amount' => $attributes['net_amount'] ?? 0,
        'fee' => $attributes['fee'] ?? 0,
        'tax_amount' => $attributes['tax_amount'] ?? 0,
        'adjustment_amount' => $attributes['adjustment_amount'] ?? 0,
        'refund_amount' => $attributes['refund_amount'] ?? 0,
        'dispute_amount' => $attributes['dispute_amount'] ?? 0,
        'currency' => $attributes['currency'] ?? 'PHP',
        'provider' => $attributes['provider'] ?? null,
        // organization.* is the merchant's actual settlement account;
        // fall back to the last transfer's receiver details if absent.
        'settlement_bank_name' => $organization['bank_name']
          ?? ($lastTransfer['receiver_institution_name'] ?? null),
        'settlement_account_number' => $organization['bank_account_number']
          ?? ($lastTransfer['receiver_account_number'] ?? null),
        'transfer_status' => $lastTransfer['status'] ?? null,
        'transfer_reference_number' => $lastTransfer['reference_number'] ?? null,
        'description' => $attributes['description'] ?? null,
        'paymongo_created_at' => isset($attributes['created_at'])
          ? now()->setTimestamp($attributes['created_at']) : now(),
        'status_updated_at' => isset($attributes['status_updated_at'])
          ? now()->setTimestamp($attributes['status_updated_at']) : null,
        'raw_payload' => $attributes,
      ]
    );
  }
}
