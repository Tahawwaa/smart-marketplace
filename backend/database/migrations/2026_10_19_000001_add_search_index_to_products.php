<?php

use App\Models\Product;
use App\Services\ProductSearchService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->text('search_text')->nullable()->after('description');
            $table->index(['is_active', 'category_id'], 'products_active_category_index');
        });

        $search = app(ProductSearchService::class);

        Product::withTrashed()->chunkById(200, function ($products) use ($search) {
            foreach ($products as $product) {
                $search->reindex($product);
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_active_category_index');
            $table->dropColumn('search_text');
        });
    }
};
