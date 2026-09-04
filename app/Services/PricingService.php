<?php

namespace App\Services;

use App\Models\Plan;

class PricingService
{
  public const TAX_RATE = 0.12;

  /**
   * The amount actually charged today, in centavos, tax included.
   * This is the ONLY place that should compute a charge amount —
   * OnboardingController::complete() must call this, not reimplement it.
   */
  public function amountDueToday(Plan $plan, string $billingCycle): int
  {
    $base = $this->baseAmount($plan, $billingCycle);

    return $base + $this->taxFor($base);
  }

  public function taxFor(int $baseAmount): int
  {
    return (int) round($baseAmount * self::TAX_RATE);
  }

  /**
   * Full pricing breakdown for a plan under both cycles. Passed to the
   * onboarding frontend so it never has to compute price/tax/total itself.
   */
  public function breakdown(Plan $plan): array
  {
    return [
      'monthly' => $this->cycleBreakdown($plan, 'monthly'),
      'annual' => $this->cycleBreakdown($plan, 'annual'),
    ];
  }

  protected function cycleBreakdown(Plan $plan, string $billingCycle): array
  {
    $base = $this->baseAmount($plan, $billingCycle);
    $tax = $this->taxFor($base);
    $total = $base + $tax;

    return [
      'base_amount' => $base,
      'tax_amount' => $tax,
      'total_amount' => $total, // what actually gets charged today
      'per_month_equivalent' => $billingCycle === 'annual'
        ? (int) round($total / 12)
        : $total,
    ];
  }

  protected function baseAmount(Plan $plan, string $billingCycle): int
  {
    return $billingCycle === 'annual'
      ? (int) round($plan->annual_price ?? $plan->monthly_price * 12)
      : (int) $plan->monthly_price;
  }
}
