<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class StaffPaymentController extends Controller
{
    private const PER_PAGE = 15;

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'all'); // all|successful|failed|pending|expired
        $page = max(1, (int) $request->query('page', 1));

        $now = Carbon::now();
        $monthStart = $now->copy()->startOfMonth();
        $monthEnd = $now->copy()->endOfMonth();
        $lastMonthStart = $now->copy()->subMonthNoOverflow()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonthNoOverflow()->endOfMonth();

        $dbStatus = match ($status) {
            'successful' => 'paid',
            'failed' => 'failed',
            'pending' => 'pending',
            'expired' => 'expired',
            default => null,
        };

        $query = Invoice::query()
            ->with(['user:id,name', 'plan:id,name'])
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($q2) use ($search) {
                    $q2->where('id', 'like', "%{$search}%")
                        ->orWhereHas('user', fn($q3) => $q3->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($dbStatus, fn($q) => $q->where('status', $dbStatus))
            ->latest();

        $total = (clone $query)->count();
        $items = $query->forPage($page, self::PER_PAGE)->get()
            ->map(fn(Invoice $invoice) => $this->transform($invoice));

        $paginated = new LengthAwarePaginator(
            $items,
            $total,
            self::PER_PAGE,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        // Stats reflect the WHOLE month, independent of the current search/status filter/page.
        $monthInvoices = Invoice::whereBetween('created_at', [$monthStart, $monthEnd])->get(['status', 'amount']);
        $lastMonthInvoices = Invoice::whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->get(['status', 'amount']);

        $collectedThisMonth = (int) $monthInvoices->where('status', 'paid')->sum('amount');
        $collectedLastMonth = (int) $lastMonthInvoices->where('status', 'paid')->sum('amount');

        $changePct = $collectedLastMonth > 0
            ? round((($collectedThisMonth - $collectedLastMonth) / $collectedLastMonth) * 100, 1)
            : null;

        $failed = $monthInvoices->where('status', 'failed');
        $pending = $monthInvoices->where('status', 'pending');

        return Inertia::render('staff/payments', [
            'invoices' => $paginated,
            'filters' => ['search' => $search ?: null, 'status' => $status],
            'monthLabel' => $now->format('F Y'),
            'stats' => [
                'collected' => [
                    'amount' => number_format($collectedThisMonth / 100, 2),
                    'count' => $monthInvoices->where('status', 'paid')->count(),
                    'change_pct' => $changePct,
                ],
                'failed' => [
                    'amount' => number_format($failed->sum('amount') / 100, 2),
                    'count' => $failed->count(),
                ],
                'pending' => [
                    'amount' => number_format($pending->sum('amount') / 100, 2),
                    'count' => $pending->count(),
                ],
            ],
        ]);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        $invoice->load(['user:id,name', 'plan:id,name']);

        return response()->json($this->transform($invoice, detailed: true));
    }

    private function transform(Invoice $invoice, bool $detailed = false): array
    {
        $occurredAt = $invoice->paid_at ?? $invoice->created_at;

        $data = [
            'id' => $invoice->id,
            'user_id' => $invoice->user_id,
            'transaction_id' => 'TXN-' . str_pad((string) $invoice->id, 6, '0', STR_PAD_LEFT),
            'member' => $invoice->user->name ?? 'Unknown',
            'plan' => $invoice->plan->name ?? '—',
            'amount' => number_format($invoice->amount / 100, 2),
            'method' => $invoice->payment_method_type,
            'method_label' => $this->methodLabel($invoice->payment_method_type),
            'status' => $invoice->status,
            'time_label' => $this->timeLabel($occurredAt),
        ];

        if ($detailed) {
            $data['date_label'] = optional($occurredAt)->format('M j, Y \a\t g:i A');
        }

        return $data;
    }

    private function methodLabel(string $method): string
    {
        return match ($method) {
            'gcash' => 'GCash',
            'maya' => 'Maya',
            'card' => 'Card',
            default => ucfirst($method),
        };
    }

    private function timeLabel(?\Carbon\CarbonInterface $date): string
    {
        if (! $date) {
            return '—';
        }

        $prefix = $date->isToday() ? 'Today' : $date->format('M j');

        return $prefix . ', ' . $date->format('g:i A');
    }
}
