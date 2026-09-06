<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('staff_role')->nullable()->after('email');   // Manager, Gym Staff, Receptionist
            $table->string('phone')->nullable()->after('staff_role');
            $table->timestamp('deactivated_at')->nullable()->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['staff_role', 'phone', 'deactivated_at']);
        });
    }
};
