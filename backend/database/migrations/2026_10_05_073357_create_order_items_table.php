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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sub_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_inventory_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name_snapshot');
            $table->string('variant_sku_snapshot');
            $table->json('selected_attributes_snapshot')->nullable();
            $table->decimal('unit_price', 14, 2);
            $table->unsignedInteger('quantity');
            $table->decimal('total_price', 14, 2);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
