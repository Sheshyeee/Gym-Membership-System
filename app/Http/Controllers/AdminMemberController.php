<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AdminMemberController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $paginated = User::query()
            ->role('user') // regular members
            ->with([
                'latestSubscription.plan',
                'latestSubscription.invoices' => fn($q) => $q->latest()->limit(1),
            ])
            ->when($search, fn($q) => $q->where(fn($q2) => $q2
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")))
            ->latest()
            ->paginate(6)
            ->withQueryString();

        $paginated->through(fn(User $user) => $this->transform($user));

        return Inertia::render('admin/member', [
            'members' => $paginated,
            'filters' => ['search' => $search ?: null],
            'stats' => $this->stats(),
        ]);
    }

    private function transform(User $user): array
    {
        $subscription = $user->latestSubscription;
        $invoice = $subscription?->invoices->first();

        return [
            'id' => $user->id,
            'code' => 'MEM-' . str_pad((string) $user->id, 5, '0', STR_PAD_LEFT),
            'name' => $user->name,
            'email' => $user->email,
            'plan' => $subscription?->plan?->name,
            'status' => $this->resolveStatus($subscription),
            'valid_until' => optional($subscription?->current_period_end)->format('M j, Y'),
            'visits' => null, // no visits table exists yet
            'payment_status' => $invoice?->status,
        ];
    }

    private function resolveStatus(?Subscription $subscription): string
    {
        if (! $subscription || ! $subscription->current_period_end) {
            return 'expired';
        }

        if ($subscription->cancelled_at) {
            return 'expired';
        }

        $end = Carbon::parse($subscription->current_period_end);

        if ($end->isPast()) {
            return 'expired';
        }

        if ($end->isBefore(now()->addDays(14))) {
            return 'expiring_soon';
        }

        return 'active';
    }

    private function stats(): array
    {
        $members = User::role('user')->with('latestSubscription')->get();

        $statuses = $members->map(fn($u) => $this->resolveStatus($u->latestSubscription));

        $signups = User::role('user')
            ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
            ->get(['created_at'])
            ->groupBy(fn($u) => $u->created_at->format('M'));

        return [
            'total' => $members->count(),
            'active' => $statuses->filter(fn($s) => $s === 'active')->count(),
            'expiring_soon' => $statuses->filter(fn($s) => $s === 'expiring_soon')->count(),
            'expired' => $statuses->filter(fn($s) => $s === 'expired')->count(),
            'monthly_signups' => collect(range(5, 0))->map(fn($ago) => [
                'label' => now()->subMonths($ago)->format('M'),
                'count' => $signups->get(now()->subMonths($ago)->format('M'), collect())->count(),
            ])->values(),
        ];
    }
    public function show(User $user): \Illuminate\Http\JsonResponse
    {
        $user->load(['subscriptions.plan', 'subscriptions.invoices']);

        $latestSubscription = $user->subscriptions->sortByDesc('created_at')->first();

        $payments = $user->subscriptions
            ->flatMap(fn($sub) => $sub->invoices)
            ->sortByDesc('created_at')
            ->values()
            ->map(fn($invoice) => [
                'id' => $invoice->id,
                'txn_id' => $invoice->processor_payment_id
                    ?? $invoice->processor_source_id
                    ?? ('INV-' . str_pad((string) $invoice->id, 5, '0', STR_PAD_LEFT)),
                'amount' => number_format($invoice->amount / 100, 2),
                'status' => $invoice->status,
                'date' => optional($invoice->paid_at ?? $invoice->due_at)->format('M j, Y'),
            ]);

        $planHistory = $user->subscriptions
            ->sortByDesc('created_at')
            ->values()
            ->map(fn($sub) => [
                'id' => $sub->id,
                'plan' => $sub->plan?->name,
                'price' => $sub->plan
                    ? number_format(
                        ($sub->billing_cycle === 'annual'
                            ? $sub->plan->annual_price
                            : $sub->plan->monthly_price) / 100,
                        2
                    )
                    : null,
                'started_at' => optional($sub->current_period_start ?? $sub->created_at)->format('M j, Y'),
            ]);

        return response()->json([
            'id' => $user->id,
            'code' => 'MEM-' . str_pad((string) $user->id, 5, '0', STR_PAD_LEFT),
            'name' => $user->name,
            'email' => $user->email,
            'phone' => null,
            'joined_at' => $user->created_at->format('M j, Y'),
            'plan' => $latestSubscription?->plan?->name,
            'status' => $this->resolveStatus($latestSubscription),
            'valid_until' => optional($latestSubscription?->current_period_end)->format('M j, Y'),
            'plan_history' => $planHistory,
            'payments' => $payments,
        ]);
    }
}
