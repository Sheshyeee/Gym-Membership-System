<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payouts', function (Blueprint $table) {
            // PayMongo's own payout id (e.g. po_xxx) — we never generate our own,
            // this table only ever mirrors what PayMongo tells us.
            $table->string('id')->primary();
            $table->string('status')->default('pending');
            $table->unsignedBigInteger('amount')->default(0);
            $table->unsignedBigInteger('net_amount')->default(0);
            $table->unsignedBigInteger('fee')->default(0);
            $table->unsignedBigInteger('tax_amount')->default(0);
            $table->unsignedBigInteger('adjustment_amount')->default(0);
            $table->unsignedBigInteger('refund_amount')->default(0);
            $table->unsignedBigInteger('dispute_amount')->default(0);
            $table->string('currency', 3)->default('PHP');
            $table->string('provider')->nullable();
            $table->string('settlement_bank_name')->nullable();
            $table->string('settlement_account_number')->nullable();
            $table->string('transfer_status')->nullable();
            $table->string('transfer_reference_number')->nullable();
            $table->string('description')->nullable();
            $table->timestamp('paymongo_created_at')->nullable();
            $table->timestamp('status_updated_at')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('paymongo_created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};
