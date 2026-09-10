<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // --- Refund fields + status enum ---

        Schema::table('invoices', function ($table) {
            if (!Schema::hasColumn('invoices', 'processor_refund_id')) {
                $table->string('processor_refund_id')->nullable()->after('processor_payment_id');
            }
            if (!Schema::hasColumn('invoices', 'refund_amount')) {
                $table->unsignedInteger('refund_amount')->nullable()->after('processor_refund_id');
            }
            if (!Schema::hasColumn('invoices', 'refunded_at')) {
                $table->timestamp('refunded_at')->nullable()->after('paid_at');
            }
        });

        DB::statement("ALTER TABLE invoices MODIFY status ENUM('pending', 'paid', 'failed', 'expired', 'refunding', 'refunded') NOT NULL DEFAULT 'pending'");

        // --- Payment method enum + retry count ---
        // Align the enum with what the app actually validates/sends
        // (gcash / paymaya) and drop 'card' since it's not implemented.
        // Widen first so 'paymaya' is a valid value before the UPDATE,
        // then migrate 'maya' rows over, then narrow the enum down.
        DB::statement("ALTER TABLE invoices MODIFY payment_method_type ENUM('gcash', 'maya', 'paymaya', 'card') NOT NULL");
        DB::statement("UPDATE invoices SET payment_method_type = 'paymaya' WHERE payment_method_type = 'maya'");
        DB::statement("ALTER TABLE invoices MODIFY payment_method_type ENUM('gcash', 'paymaya') NOT NULL");

        if (!Schema::hasColumn('invoices', 'retry_count')) {
            Schema::table('invoices', function ($table) {
                $table->unsignedInteger('retry_count')->default(0)->after('processor_payment_id');
            });
        }
    }

    public function down(): void
    {
        // --- Payment method enum + retry count ---

        if (Schema::hasColumn('invoices', 'retry_count')) {
            Schema::table('invoices', function ($table) {
                $table->dropColumn('retry_count');
            });
        }

        DB::statement("ALTER TABLE invoices MODIFY payment_method_type ENUM('gcash', 'maya', 'paymaya', 'card') NOT NULL");
        DB::statement("UPDATE invoices SET payment_method_type = 'maya' WHERE payment_method_type = 'paymaya'");
        DB::statement("ALTER TABLE invoices MODIFY payment_method_type ENUM('gcash', 'maya', 'card') NOT NULL");

        // --- Refund fields + status enum ---

        DB::statement("ALTER TABLE invoices MODIFY status ENUM('pending', 'paid', 'failed', 'expired') NOT NULL DEFAULT 'pending'");

        Schema::table('invoices', function ($table) {
            $table->dropColumn(array_filter([
                Schema::hasColumn('invoices', 'processor_refund_id') ? 'processor_refund_id' : null,
                Schema::hasColumn('invoices', 'refund_amount') ? 'refund_amount' : null,
                Schema::hasColumn('invoices', 'refunded_at') ? 'refunded_at' : null,
            ]));
        });
    }
};
