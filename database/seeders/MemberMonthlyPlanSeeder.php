<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class MemberMonthlyPlanSeeder extends Seeder
{
  public function run(): void
  {
    if (app()->environment('production')) {
      $this->command->error('Refusing to run fake member seeder in production.');
      return;
    }

    Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);

    // Reuse an existing plan if present, otherwise create one
    $plan = Plan::firstOrCreate(
      ['slug' => 'basic'],
      [
        'name' => 'Basic',
        'monthly_price' => 79900,
        'annual_price' => 799900,
        'is_active' => true,
      ]
    );

    $user = User::firstOrCreate(
      ['email' => 'clapisdave9@gmail.com'],
      [
        'name' => 'Test Member',
        'password' => bcrypt('daveevad27'),
        'email_verified_at' => now(),
      ]
    );

    $user->assignRole('user');

    $start = now()->startOfDay();

    $subscription = $user->subscriptions()->create([
      'plan_id' => $plan->id,
      'billing_cycle' => 'monthly',
      'status' => 'active',
      'current_period_start' => $start,
      'current_period_end' => $start->copy()->addMonth(),
    ]);

    $subscription->invoices()->create([
      'user_id' => $user->id,
      'plan_id' => $plan->id,
      'amount' => $plan->monthly_price,
      'currency' => 'PHP',
      'payment_method_type' => 'gcash',
      'status' => 'paid',
      'due_at' => $start,
      'paid_at' => $start,
    ]);

    $this->command->info("Seeded member '{$user->email}' with an active monthly '{$plan->slug}' subscription.");
  }
}
