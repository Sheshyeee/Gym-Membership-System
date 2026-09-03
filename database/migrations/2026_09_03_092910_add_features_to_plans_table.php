<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->string('tagline')->nullable()->after('slug');
            $table->json('features')->nullable()->after('annual_price');
            $table->boolean('highlighted')->default(false)->after('features');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['tagline', 'features', 'highlighted']);
        });
    }
};
