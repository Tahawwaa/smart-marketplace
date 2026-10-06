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
        Schema::create('vendor_payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained()->restrictOnDelete();
            $table->foreignId('sub_order_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 14, 2);
            $table->string('status')->default('pending');
            $table->string('payout_reference')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_payouts');
    }
};
