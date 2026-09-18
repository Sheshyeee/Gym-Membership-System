<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;

class MemberPaymentController extends Controller
{
    public function index(Request $request)
    {
        $invoices = Invoice::query()
            ->where('user_id', $request->user()->id)
            ->orderByRaw('COALESCE(paid_at, due_at, created_at) DESC')
            ->get();

        $payments = $invoices->map(function (Invoice $invoice) {
            $date = $invoice->paid_at ?? $invoice->due_at ?? $invoice->created_at;

            return [
                'id' => $invoice->id,
                'reference' => 'TXN-' . str_pad((string) $invoice->id, 6, '0', STR_PAD_LEFT),
                'method_key' => $this->methodKey($invoice->payment_method_type),
                'method_label' => $this->methodLabel($invoice->payment_method_type),
                'amount' => number_format($invoice->amount),
                'currency' => $invoice->currency ?? 'PHP',
                'status' => $this->status($invoice->status),
                'date' => $date?->format('F j, Y'),
                'year' => (int) ($date?->year ?? now()->year),
            ];
        })->values();

        return inertia('member/payments', [
            'payments' => $payments,
            'years' => $payments->pluck('year')->unique()->sortDesc()->values(),
        ]);
    }

    private function methodKey(?string $type): string
    {
        return match ($type) {
            'gcash' => 'gcash',
            'paymaya' => 'maya',
            'card' => 'card',
            default => 'other',
        };
    }

    private function methodLabel(?string $type): string
    {
        return match ($type) {
            'gcash' => 'GCash payment',
            'paymaya' => 'Maya payment',
            'card' => 'Credit Card payment',
            default => 'Payment',
        };
    }

    private function status(?string $status): string
    {
        return match ($status) {
            'paid' => 'successful',
            'failed' => 'failed',
            'refunded' => 'refunded',
            default => 'pending',
        };
    }
}
