<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained();

            $table->unsignedInteger('amount'); // centavos, e.g. 149900 = ₱1,499.00
            $table->string('currency', 3)->default('PHP');

            $table->enum('payment_method_type', ['gcash', 'maya', 'card']);
            $table->enum('status', ['pending', 'paid', 'failed', 'expired'])->default('pending');

            $table->string('processor_source_id')->nullable();          // e-wallets
            $table->string('processor_payment_intent_id')->nullable();  // cards
            $table->string('processor_payment_id')->nullable();         // confirmed charge

            $table->timestamp('due_at');
            $table->timestamp('paid_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
