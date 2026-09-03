<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class PaymentService
{
  protected string $baseUrl = 'https://api.paymongo.com/v1';

  protected function client()
  {
    // PayMongo uses HTTP Basic Auth: secret key as username, blank password.
    return Http::withBasicAuth(config('services.paymongo.secret_key'), '')
      ->baseUrl($this->baseUrl)
      ->acceptJson();
  }

  /**
   * Create a "Source" for e-wallet payments (GCash / Maya).
   * The user must be redirected to the returned checkout_url to approve payment.
   *
   * @param  int  $amount  Amount in centavos (e.g. 149900 = ₱1,499.00)
   */
  public function createSource(int $amount, string $type, string $redirectSuccessUrl, string $redirectFailedUrl): array
  {
    if (! in_array($type, ['gcash', 'paymaya'], true)) {
      throw new RuntimeException("Unsupported source type: {$type}");
    }

    $response = $this->client()->post('/sources', [
      'data' => [
        'attributes' => [
          'amount' => $amount,
          'currency' => 'PHP',
          'type' => $type,
          'redirect' => [
            'success' => $redirectSuccessUrl,
            'failed' => $redirectFailedUrl,
          ],
        ],
      ],
    ]);

    if ($response->failed()) {
      Log::error('PayMongo createSource failed', ['body' => $response->json()]);
      throw new RuntimeException('Unable to create payment source.');
    }

    return $response->json('data');
  }

  public function retrieveSource(string $sourceId): array
  {
    $response = $this->client()->get("/sources/{$sourceId}");

    if ($response->failed()) {
      Log::error('PayMongo retrieveSource failed', ['id' => $sourceId, 'body' => $response->json()]);
      throw new RuntimeException('Unable to retrieve payment source.');
    }

    return $response->json('data');
  }

  /**
   * Create a PaymentIntent for card payments.
   * The frontend uses PayMongo.js to tokenize the card and confirm this intent.
   */
  public function createPaymentIntent(int $amount): array
  {
    $response = $this->client()->post('/payment_intents', [
      'data' => [
        'attributes' => [
          'amount' => $amount,
          'currency' => 'PHP',
          'payment_method_allowed' => ['card'],
          'capture_type' => 'automatic',
        ],
      ],
    ]);

    if ($response->failed()) {
      Log::error('PayMongo createPaymentIntent failed', ['body' => $response->json()]);
      throw new RuntimeException('Unable to create payment intent.');
    }

    return $response->json('data');
  }

  public function retrievePaymentIntent(string $intentId): array
  {
    $response = $this->client()->get("/payment_intents/{$intentId}");

    if ($response->failed()) {
      Log::error('PayMongo retrievePaymentIntent failed', ['id' => $intentId, 'body' => $response->json()]);
      throw new RuntimeException('Unable to retrieve payment intent.');
    }

    return $response->json('data');
  }
  /**
   * Charge a chargeable Source. This is the step that actually moves money —
   * a Source becoming "chargeable" only means the user approved it, not that
   * they were charged.
   */
  public function createPaymentFromSource(string $sourceId, int $amount): array
  {
    $response = $this->client()->post('/payments', [
      'data' => [
        'attributes' => [
          'amount' => $amount,
          'currency' => 'PHP',
          'source' => [
            'id' => $sourceId,
            'type' => 'source',
          ],
        ],
      ],
    ]);

    if ($response->failed()) {
      Log::error('PayMongo createPaymentFromSource failed', ['source_id' => $sourceId, 'body' => $response->json()]);
      throw new RuntimeException('Unable to charge source.');
    }

    return $response->json('data');
  }
}
