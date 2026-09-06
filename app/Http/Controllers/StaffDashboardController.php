<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class StaffDashboardController extends Controller
{
    public function index(Request $request)
    {
        return inertia('staffs/dashboard');
    }
}
