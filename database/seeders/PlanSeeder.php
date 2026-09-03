<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Basic',
                'slug' => 'basic',
                'tagline' => 'Train on your terms',
                'monthly_price' => 79900,
                'annual_price' => 767040,
                'highlighted' => false,
                'features' => [
                    'Full gym floor access',
                    'Locker room & showers',
                    '2 group classes / month',
                    'Mobile QR check-in',
                    'Activity tracking',
                ],
            ],
            [
                'name' => 'Premium',
                'slug' => 'premium',
                'tagline' => 'The best way to build momentum',
                'monthly_price' => 149900,
                'annual_price' => 1439040,
                'highlighted' => true,
                'features' => [
                    'Everything in Basic',
                    'Unlimited group classes',
                    '1 trainer session / month',
                    'Nutrition guide access',
                    'Priority booking',
                    'Guest passes (2 / month)',
                ],
            ],
            [
                'name' => 'Elite',
                'slug' => 'elite',
                'tagline' => 'Your strongest year starts here',
                'monthly_price' => 249900,
                'annual_price' => 2399040,
                'highlighted' => false,
                'features' => [
                    'Everything in Premium',
                    '4 trainer sessions / month',
                    'Recovery & spa access',
                    'Personalized workout plan',
                    'Nutrition consultations',
                    'Unlimited guest passes',
                ],
            ],
        ];

        foreach ($plans as $plan) {
            Plan::create($plan);
        }
    }
}
