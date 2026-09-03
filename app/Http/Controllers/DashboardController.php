<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->hasRole('admin')) {
            return redirect()->route('overview');
        }

        if ($user->hasRole('staff')) {
            return redirect()->route('staff.dashboard');
        }

        return Inertia::render('member/dashboard', [
            'hasSubscription' => $user->hasActiveSubscription(),
        ]);
    }
}
