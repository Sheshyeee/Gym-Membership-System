<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MemberProfileController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $subscription = $user->activeSubscription()->with('plan')->first();

        return inertia('member/profile-settings', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
            ],
            'hasSubscription' => (bool) $subscription,
            'planName' => $subscription?->plan->name,
        ]);
    }
}
