<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class StaffProfileSettingsController extends Controller
{
    public function index(Request $request)
    {
        return inertia('staff/profile-settings', [
            'user' => $request->user(),
        ]);
    }
}
