<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class OverviewController extends Controller
{
    public function index(Request $request)
    {
        return inertia('overview');
    }
}
