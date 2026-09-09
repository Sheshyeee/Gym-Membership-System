<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class StaffSeeder extends Seeder
{
  public function run(): void
  {


    Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);

    $staffMembers = [
      [
        'name' => 'Maria Santos',
        'email' => 'staff.manager@example.test',
        'staff_role' => 'Manager',
      ],
      [
        'name' => 'staff test',
        'email' => 'clapisdaves10@gmail.com',
        'staff_role' => 'staff',
      ],
      [
        'name' => 'Ana Cruz',
        'email' => 'staff.receptionist@example.test',
        'staff_role' => 'Receptionist',
      ],
    ];

    foreach ($staffMembers as $staff) {
      $user = User::firstOrCreate(
        ['email' => $staff['email']],
        [
          'name' => $staff['name'],
          'password' => Hash::make('daveevad27'),
          'staff_role' => $staff['staff_role'],
          'email_verified_at' => now(),
        ]
      );

      $user->assignRole('staff');

      $this->command->info("Seeded staff: {$user->email} ({$staff['staff_role']}) — password: password");
    }
  }
}
