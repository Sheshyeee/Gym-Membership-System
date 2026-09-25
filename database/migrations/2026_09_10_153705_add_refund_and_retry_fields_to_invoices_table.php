<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        // --- Refund fields ---
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

        // --- Status enum ---
        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE invoices ALTER COLUMN status TYPE VARCHAR(20)");
            DB::statement("ALTER TABLE invoices ALTER COLUMN status SET DEFAULT 'pending'");
            DB::statement("ALTER TABLE invoices ALTER COLUMN status SET NOT NULL");
            DB::statement("ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check");
            DB::statement("ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refunding', 'refunded'))");
        } else {
            DB::statement("ALTER TABLE invoices MODIFY status ENUM('pending', 'paid', 'failed', 'expired', 'refunding', 'refunded') NOT NULL DEFAULT 'pending'");
        }

        // --- Payment method enum + retry count ---
        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE invoices ALTER COLUMN payment_method_type TYPE VARCHAR(20)");
            DB::statement("ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_type_check");
            DB::statement("ALTER TABLE invoices ADD CONSTRAINT invoices_payment_method_type_check CHECK (payment_method_type IN ('gcash', 'maya', 'paymaya', 'card'))");

            DB::statement("UPDATE invoices SET payment_method_type = 'paymaya' WHERE payment_method_type = 'maya'");

            DB::statement("ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_type_check");
            DB::statement("ALTER TABLE invoices ADD CONSTRAINT invoices_payment_method_type_check CHECK (payment_method_type IN ('gcash', 'paymaya'))");
            DB::statement("ALTER TABLE invoices ALTER COLUMN payment_method_type SET NOT NULL");
        } else {
            DB::statement("ALTER TABLE invoices MODIFY payment_method_type ENUM('gcash', 'maya', 'paymaya', 'card') NOT NULL");
            DB::statement("UPDATE invoices SET payment_method_type = 'paymaya' WHERE payment_method_type = 'maya'");
            DB::statement("ALTER TABLE invoices MODIFY payment_method_type ENUM('gcash', 'paymaya') NOT NULL");
        }

        if (!Schema::hasColumn('invoices', 'retry_count')) {
            Schema::table('invoices', function ($table) {
                $table->unsignedInteger('retry_count')->default(0)->after('processor_payment_id');
            });
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        // --- Payment method enum + retry count ---
        if (Schema::hasColumn('invoices', 'retry_count')) {
            Schema::table('invoices', function ($table) {
                $table->dropColumn('retry_count');
            });
        }

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_type_check");
            DB::statement("ALTER TABLE invoices ADD CONSTRAINT invoices_payment_method_type_check CHECK (payment_method_type IN ('gcash', 'maya', 'paymaya', 'card'))");

            DB::statement("UPDATE invoices SET payment_method_type = 'maya' WHERE payment_method_type = 'paymaya'");

            DB::statement("ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_type_check");
            DB::statement("ALTER TABLE invoices ADD CONSTRAINT invoices_payment_method_type_check CHECK (payment_method_type IN ('gcash', 'maya', 'card'))");
        } else {
            DB::statement("ALTER TABLE invoices MODIFY payment_method_type ENUM('gcash', 'maya', 'paymaya', 'card') NOT NULL");
            DB::statement("UPDATE invoices SET payment_method_type = 'maya' WHERE payment_method_type = 'paymaya'");
            DB::statement("ALTER TABLE invoices MODIFY payment_method_type ENUM('gcash', 'maya', 'card') NOT NULL");
        }

        // --- Status enum ---
        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check");
            DB::statement("ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('pending', 'paid', 'failed', 'expired'))");
        } else {
            DB::statement("ALTER TABLE invoices MODIFY status ENUM('pending', 'paid', 'failed', 'expired') NOT NULL DEFAULT 'pending'");
        }

        Schema::table('invoices', function ($table) {
            $table->dropColumn(array_filter([
                Schema::hasColumn('invoices', 'processor_refund_id') ? 'processor_refund_id' : null,
                Schema::hasColumn('invoices', 'refund_amount') ? 'refund_amount' : null,
                Schema::hasColumn('invoices', 'refunded_at') ? 'refunded_at' : null,
            ]));
        });
    }
};
