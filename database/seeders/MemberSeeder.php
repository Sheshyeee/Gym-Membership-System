<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class MemberSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command->error('Refusing to run fake member seeder in production.');
            return;
        }

        Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);

        $plans = collect([
            ['name' => 'Basic', 'slug' => 'basic', 'monthly_price' => 79900, 'annual_price' => 799900],
            ['name' => 'Premium', 'slug' => 'premium', 'monthly_price' => 149900, 'annual_price' => 1499900],
            ['name' => 'Elite', 'slug' => 'elite', 'monthly_price' => 249900, 'annual_price' => 2499900],
        ])->map(fn($p) => Plan::firstOrCreate(['slug' => $p['slug']], [...$p, 'is_active' => true]));

        // 8 active (healthy), 4 expiring soon, 5 expired, 3 pending/never paid
        $scenarios = [
            ...array_fill(0, 8, 'active'),
            ...array_fill(0, 4, 'expiring_soon'),
            ...array_fill(0, 5, 'expired'),
            ...array_fill(0, 3, 'pending'),
        ];

        foreach ($scenarios as $i => $scenario) {
            $user = User::factory()->create();
            $user->assignRole('user');

            $plan = $plans->random();
            $start = now()->subMonths(rand(1, 6));

            $subscription = $user->subscriptions()->create([
                'plan_id' => $plan->id,
                'billing_cycle' => fake()->randomElement(['monthly', 'annual']),
                'status' => $scenario === 'pending' ? 'pending' : 'active',
                'current_period_start' => $scenario === 'pending' ? null : $start,
                'current_period_end' => match ($scenario) {
                    'active' => now()->addMonths(rand(2, 6)),
                    'expiring_soon' => now()->addDays(rand(1, 13)),
                    'expired' => now()->subDays(rand(1, 30)),
                    'pending' => null,
                },
            ]);

            $invoiceStatus = match ($scenario) {
                'active', 'expiring_soon' => 'paid',
                'expired' => fake()->randomElement(['paid', 'expired']),
                'pending' => fake()->randomElement(['pending', 'failed']),
            };

            $subscription->invoices()->create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'amount' => $plan->monthly_price,
                'currency' => 'PHP',
                'payment_method_type' => fake()->randomElement(['gcash', 'maya']),
                'status' => $invoiceStatus,
                'due_at' => $start,
                'paid_at' => $invoiceStatus === 'paid' ? $start : null,
            ]);
        }

        $this->command->info('Seeded ' . count($scenarios) . ' fake members with varied subscription states.');
    }
}
