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
        Schema::create('sub_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained()->restrictOnDelete();
            $table->string('sub_order_number')->unique();
            $table->decimal('subtotal_price', 14, 2)->default(0);
            $table->decimal('shipping_fee', 14, 2)->default(0);
            $table->decimal('commission_rate', 5, 2)->default(0);
            $table->decimal('commission_amount', 14, 2)->default(0);
            $table->decimal('vendor_net_amount', 14, 2)->default(0);
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sub_orders');
    }
};
