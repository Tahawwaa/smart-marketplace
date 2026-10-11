<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->unsignedSmallInteger('depth')->default(0)->after('slug')->index();
        });

        Schema::table('attributes', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('name');
        });

        Schema::table('attribute_values', function (Blueprint $table) {
            $table->string('color_code', 7)->nullable()->after('value');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('weight_grams');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropIndex(['barcode']);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->unique('barcode');
        });

        Schema::create('warranties', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedSmallInteger('duration_months')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('vendor_inventories', function (Blueprint $table) {
            $table->foreignId('warranty_id')->nullable()->after('variant_id')->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('lead_time_days')->default(0)->after('warranty_id');
        });

        Schema::create('inventory_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_inventory_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cart_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('quantity');
            $table->string('status')->default('active');
            $table->timestamp('expires_at')->index();
            $table->timestamps();
            $table->index(['status', 'expires_at']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['category_id', 'is_active']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['category_id', 'is_active', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['category_id', 'is_active', 'created_at']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['category_id', 'is_active']);
        });

        Schema::dropIfExists('inventory_reservations');

        Schema::table('vendor_inventories', function (Blueprint $table) {
            $table->dropConstrainedForeignId('warranty_id');
            $table->dropColumn('lead_time_days');
        });

        Schema::dropIfExists('warranties');

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropUnique(['barcode']);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->index('barcode');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });

        Schema::table('attribute_values', function (Blueprint $table) {
            $table->dropColumn('color_code');
        });

        Schema::table('attributes', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex(['depth']);
            $table->dropColumn('depth');
        });
    }
};
