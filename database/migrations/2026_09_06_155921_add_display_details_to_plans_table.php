<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Your `plans` table already has: name, slug, monthly_price,
 * annual_price, is_active, tagline, features, highlighted.
 * This just adds the extra display fields the edit dialog / cards need.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            if (! Schema::hasColumn('plans', 'description')) {
                $table->text('description')->nullable()->after('tagline');
            }

            if (! Schema::hasColumn('plans', 'color')) {
                $table->string('color')->nullable()->after('highlighted');
            }

            if (! Schema::hasColumn('plans', 'sort_order')) {
                $table->unsignedSmallInteger('sort_order')->default(0)->after('color');
            }
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            foreach (['description', 'color', 'sort_order'] as $column) {
                if (Schema::hasColumn('plans', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
