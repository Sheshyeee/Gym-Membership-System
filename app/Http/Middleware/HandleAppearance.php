<?php

namespace App\Http\Middleware;

use App\Models\GymProfile;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class HandleAppearance
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    // HandleAppearance.php
    public function handle(Request $request, Closure $next): Response
    {
        $gymProfile = GymProfile::current();

        View::share('appearance', $request->cookie('appearance') ?? 'system');
        View::share('gymProfile', $gymProfile);
        $request->attributes->set('gymProfile', $gymProfile);

        return $next($request);
    }
}
