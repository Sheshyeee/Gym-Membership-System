<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class QRAccessController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $subscription = $user->activeSubscription()->with('plan')->first()
            ?? $user->latestSubscription()->with('plan')->first();

        return inertia('member/qr-access', [
            'member' => [
                'name' => $user->name,
                'initials' => collect(explode(' ', $user->name))
                    ->map(fn($part) => strtoupper(substr($part, 0, 1)))
                    ->take(2)
                    ->implode(''),
                'memberId' => 'FF-' . str_pad((string) $user->id, 6, '0', STR_PAD_LEFT),
                'qrToken' => $user->qr_token,
                'planName' => $subscription?->plan?->name,
                'status' => $subscription?->status ?? 'inactive',
                'validUntil' => $subscription?->current_period_end?->format('M j, Y'),
            ],
        ]);
    }

    public function regenerate(Request $request)
    {
        $request->user()->regenerateQrToken();

        return back()->with('success', 'Your access code has been refreshed.');
    }
}
