<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountIsActive
{
  public function handle(Request $request, Closure $next): Response
  {
    $user = $request->user();

    if ($user && ! $user->isActive()) {
      Auth::logout();
      $request->session()->invalidate();
      $request->session()->regenerateToken();

      return redirect()->route('home')
        ->withErrors(['email' => 'This account has been deactivated.']);
    }

    return $next($request);
  }
}
