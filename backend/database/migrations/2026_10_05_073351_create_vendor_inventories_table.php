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
        Schema::create('vendor_inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->decimal('price', 14, 2);
            $table->decimal('sale_price', 14, 2)->nullable();
            $table->unsignedInteger('quantity')->default(0);
            $table->unsignedInteger('reserved_quantity')->default(0);
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->unique(['vendor_id', 'variant_id']);
            $table->index(['variant_id', 'is_available']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_inventories');
    }
};
