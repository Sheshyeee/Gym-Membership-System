<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class StaffMemberController extends Controller
{
    private const PER_PAGE = 5;

    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString(); // all|active|expiring_soon|expired
        $page = max(1, $request->integer('page', 1));

        $users = User::query()
            ->role('user')
            ->with(['latestSubscription.plan'])
            ->when($search, fn($q) => $q->where(fn($q2) => $q2
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")))
            ->latest()
            ->get();

        // Compute status for every matching member first (search-filtered,
        // but NOT status-filtered yet) so tab counts reflect the whole set.
        $transformed = $users->map(fn(User $user) => $this->transform($user));

        $statusCounts = [
            'all' => $transformed->count(),
            'active' => $transformed->where('status', 'active')->count(),
            'expiring_soon' => $transformed->where('status', 'expiring_soon')->count(),
            'expired' => $transformed->where('status', 'expired')->count(),
        ];

        if ($status && $status !== 'all') {
            $transformed = $transformed->filter(fn($row) => $row['status'] === $status)->values();
        }

        $total = $transformed->count();
        $items = $transformed->forPage($page, self::PER_PAGE)->values();

        $paginated = new LengthAwarePaginator(
            $items,
            $total,
            self::PER_PAGE,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        return Inertia::render('staffs/members', [
            'members' => $paginated,
            'filters' => [
                'search' => $search ?: null,
                'status' => $status ?: 'all',
            ],
            'statusCounts' => $statusCounts,
        ]);
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
                'amount' => number_format($invoice->amount / 100, 2),
                'status' => $invoice->status,
                'date' => optional($invoice->paid_at ?? $invoice->due_at)->format('M j, Y \a\t g:i A'),
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
            'code' => 'MEM-' . str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
            'name' => $user->name,
            'email' => $user->email,
            'phone' => null,
            'joined_at' => $user->created_at->format('F j, Y'),
            'plan' => $latestSubscription?->plan?->name,
            'status' => $this->resolveStatus($latestSubscription),
            'valid_until' => optional($latestSubscription?->current_period_end)->format('M j, Y'),
            'monthly_visits' => null,
            'last_check_in' => null,
            'plan_history' => $planHistory,
            'payments' => $payments,
        ]);
    }

    private function transform(User $user): array
    {
        $subscription = $user->latestSubscription;

        return [
            'id' => $user->id,
            'code' => 'MEM-' . str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
            'name' => $user->name,
            'email' => $user->email,
            'plan' => $subscription?->plan?->name,
            'status' => $this->resolveStatus($subscription),
            'valid_until' => optional($subscription?->current_period_end)->format('M j, Y'),
            'last_visit' => null,
            'visits' => null,
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
}
