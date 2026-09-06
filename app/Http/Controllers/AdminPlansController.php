<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePlanRequest;
use App\Models\Plan;

class AdminPlansController extends Controller
{
    public function index()
    {
        $plans = Plan::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            // ASSUMPTION: your Subscription model has a `status` column
            // and 'active' is the value that means a currently-paying
            // member. Adjust the column/value below if yours differs.
            ->withCount(['subscriptions as active_members_count' => function ($query) {
                $query->where('status', 'active');
            }])
            ->get()
            ->map(fn(Plan $plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'tagline' => $plan->tagline,
                'description' => $plan->description,
                'monthly_price' => $plan->monthly_price,
                'annual_price' => $plan->annual_price,
                'features' => $plan->features ?? [],
                'highlighted' => $plan->highlighted,
                'is_active' => $plan->is_active,
                'color' => $plan->color,
                'active_members_count' => $plan->active_members_count,
            ]);

        return inertia('admin/membership-plans', [
            'plans' => $plans,
        ]);
    }

    public function update(UpdatePlanRequest $request, Plan $plan)
    {
        $plan->update($request->validated());

        return back()->with('success', "{$plan->name} plan updated.");
    }
}
