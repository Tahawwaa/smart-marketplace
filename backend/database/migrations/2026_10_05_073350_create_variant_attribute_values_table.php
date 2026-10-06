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
        Schema::create('variant_attribute_values', function (Blueprint $table) {
            $table->foreignId('variant_id');
            $table->foreignId('attribute_value_id');

            $table->primary(['variant_id', 'attribute_value_id']);
            $table->foreign('variant_id')->references('id')->on('product_variants')->cascadeOnDelete();
            $table->foreign('attribute_value_id')->references('id')->on('attribute_values')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('variant_attribute_values');
    }
};
