<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gym_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('My Gym');
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->text('about')->nullable();
            $table->string('cover_path')->nullable();
            $table->timestamps();
        });

        DB::table('gym_profiles')->insert([
            'name' => 'My Gym',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('gym_profiles');
    }
};
