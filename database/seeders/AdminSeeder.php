<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'clapisdave8@gmail.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('daveevad27'), // change this!
                'email_verified_at' => now(),
            ]
        );

        $admin->syncRoles(['admin']);
    }
}
