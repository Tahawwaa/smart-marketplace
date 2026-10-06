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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('order_number')->unique();
            $table->json('shipping_address_snapshot');
            $table->decimal('total_items_price', 14, 2)->default(0);
            $table->decimal('total_shipping_fee', 14, 2)->default(0);
            $table->decimal('grand_total', 14, 2)->default(0);
            $table->string('payment_status')->default('pending');
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->index('payment_status');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
