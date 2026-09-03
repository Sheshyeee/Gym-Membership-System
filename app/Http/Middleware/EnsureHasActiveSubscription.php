<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// app/Http/Middleware/EnsureHasActiveSubscription.php
// app/Http/Middleware/EnsureHasActiveSubscription.php
class EnsureHasActiveSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Only staff/admin bypass — everyone else needs the subscription check
        if ($user->hasRole('admin') || $user->hasRole('staff')) {
            return $next($request);
        }

        if ($user->hasActiveSubscription() || $user->onboarding_skipped_at) {
            return $next($request);
        }

        return redirect()->route('onboarding.index');
    }
}
