<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePlanRequest extends FormRequest
{
  public function authorize(): bool
  {
    // Route is already gated by the `role:admin` middleware.
    return true;
  }

  /**
   * Normalize monthly_price / annual_price so the frontend can send
   * plain pesos ("799") or a formatted string ("₱1,999") and either
   * works — both are converted to integer centavos.
   */
  protected function prepareForValidation(): void
  {
    $this->merge([
      'monthly_price' => $this->pesosToCentavos($this->input('monthly_price')),
      'annual_price' => $this->filled('annual_price')
        ? $this->pesosToCentavos($this->input('annual_price'))
        : null,
    ]);
  }

  private function pesosToCentavos(mixed $value): int
  {
    $numeric = preg_replace('/[^\d.]/', '', (string) $value);

    return $numeric === '' ? 0 : (int) round(((float) $numeric) * 100);
  }

  public function rules(): array
  {
    return [
      'name' => ['required', 'string', 'max:60'],
      'description' => ['nullable', 'string', 'max:500'],
      'monthly_price' => ['required', 'integer', 'min:0'],
      'annual_price' => ['nullable', 'integer', 'min:0'],
      'features' => ['required', 'array', 'min:1'],
      'features.*' => ['required', 'string', 'max:120'],
    ];
  }
}
