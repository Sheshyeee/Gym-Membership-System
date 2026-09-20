<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            // Snapshotted the moment a "switch" invoice is created, from the
            // days remaining on the subscription being switched away from.
            // Applied on top of the new plan's normal period length once the
            // switch is paid, so nobody loses unused time by upgrading.
            $table->unsignedInteger('remaining_days_credit')->default(0)->after('cancelled_at');

            // Set when this subscription is closed out because the user
            // switched to a different plan (as opposed to cancelling outright).
            $table->timestamp('switched_at')->nullable()->after('remaining_days_credit');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['remaining_days_credit', 'switched_at']);
        });
    }
};
