<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const RESTRICTED_FOREIGN_KEYS = [
        ['payments', 'order_id', 'orders'],
        ['sub_orders', 'order_id', 'orders'],
        ['order_items', 'sub_order_id', 'sub_orders'],
        ['shipments', 'sub_order_id', 'sub_orders'],
        ['vendor_payouts', 'sub_order_id', 'sub_orders'],
        ['vendor_inventories', 'variant_id', 'product_variants'],
        ['inventory_logs', 'vendor_inventory_id', 'vendor_inventories'],
        ['product_reviews', 'order_item_id', 'order_items'],
    ];

    private const CHECKS = [
        'users' => [
            'chk_users_role' => "role in ('customer','vendor','admin')",
        ],
        'products' => [
            'chk_products_status' => "status in ('draft','pending','approved','rejected')",
        ],
        'coupons' => [
            'chk_coupons_type' => "discount_type in ('percent','fixed')",
            'chk_coupons_value' => 'discount_value > 0',
        ],
        'refunds' => [
            'chk_refunds_status' => "status in ('pending','approved','rejected','processed')",
            'chk_refunds_amount' => 'amount > 0',
        ],
        'orders' => [
            'chk_orders_totals' => 'grand_total = total_items_price + total_shipping_fee - discount_total + tax_total',
        ],
        'payout_batches' => [
            'chk_payout_batches_status' => "status in ('pending','paid','failed')",
        ],
        'ai_jobs' => [
            'chk_ai_jobs_status' => "status in ('pending','processing','completed','failed')",
        ],
    ];

    public function up(): void
    {
        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('logo_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('brand_id')->nullable()->after('category_id')->constrained()->nullOnDelete();
            $table->foreignId('vendor_id')->nullable()->after('brand_id')->constrained()->nullOnDelete();
            $table->string('status')->default('approved')->after('ai_generated_description')->index();
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 500)->nullable();
        });

        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->string('path');
            $table->string('alt')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
            $table->index(['product_id', 'sort_order']);
        });

        Schema::create('shipping_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->decimal('base_fee', 14, 2)->default(0);
            $table->decimal('fee_per_kg', 14, 2)->default(0);
            $table->unsignedSmallInteger('estimated_days_min')->nullable();
            $table->unsignedSmallInteger('estimated_days_max')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('sub_orders', function (Blueprint $table) {
            $table->foreignId('shipping_method_id')->nullable()->after('vendor_id')->constrained()->nullOnDelete();
        });

        Schema::create('payout_batches', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->decimal('total_amount', 14, 2)->default(0);
            $table->string('status')->default('pending')->index();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::table('vendor_payouts', function (Blueprint $table) {
            $table->foreignId('payout_batch_id')->nullable()->after('sub_order_id')->constrained()->nullOnDelete();
        });

        Schema::table('addresses', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
        });

        Schema::table('vendor_inventories', function (Blueprint $table) {
            $table->unsignedInteger('lock_version')->default(0);
        });

        Schema::table('inventory_logs', function (Blueprint $table) {
            $table->foreign('order_item_id')->references('id')->on('order_items')->nullOnDelete();
        });

        $this->rebuildVariantAttributeValues();
        $this->restrictFinancialForeignKeys();
        $this->addFullTextIndex();
        $this->addChecks();
    }

    public function down(): void
    {
        $this->dropChecks();
        $this->dropFullTextIndex();

        foreach (self::RESTRICTED_FOREIGN_KEYS as [$tableName, $column, $parent]) {
            Schema::table($tableName, function (Blueprint $table) use ($column) {
                $table->dropForeign([$column]);
            });
            Schema::table($tableName, function (Blueprint $table) use ($column, $parent) {
                $table->foreign($column)->references('id')->on($parent)->cascadeOnDelete();
            });
        }

        $this->restoreVariantAttributeValues();

        Schema::table('inventory_logs', function (Blueprint $table) {
            $table->dropForeign(['order_item_id']);
        });

        Schema::table('vendor_inventories', function (Blueprint $table) {
            $table->dropColumn('lock_version');
        });

        Schema::table('addresses', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });

        Schema::table('vendor_payouts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('payout_batch_id');
        });

        Schema::dropIfExists('payout_batches');

        Schema::table('sub_orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shipping_method_id');
        });

        Schema::dropIfExists('shipping_methods');
        Schema::dropIfExists('product_images');

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropConstrainedForeignId('vendor_id');
            $table->dropConstrainedForeignId('brand_id');
            $table->dropColumn(['status', 'meta_title', 'meta_description']);
        });

        Schema::dropIfExists('brands');
    }

    private function rebuildVariantAttributeValues(): void
    {
        Schema::table('attribute_values', function (Blueprint $table) {
            $table->unique(['id', 'attribute_id']);
        });

        $rows = DB::table('variant_attribute_values')
            ->join('attribute_values', 'attribute_values.id', '=', 'variant_attribute_values.attribute_value_id')
            ->get(['variant_attribute_values.variant_id', 'variant_attribute_values.attribute_value_id', 'attribute_values.attribute_id'])
            ->map(fn ($row) => (array) $row)
            ->all();

        Schema::drop('variant_attribute_values');

        Schema::create('variant_attribute_values', function (Blueprint $table) {
            $table->unsignedBigInteger('variant_id');
            $table->unsignedBigInteger('attribute_id');
            $table->unsignedBigInteger('attribute_value_id');
            $table->primary(['variant_id', 'attribute_value_id']);
            $table->unique(['variant_id', 'attribute_id']);
            $table->foreign('variant_id')->references('id')->on('product_variants')->cascadeOnDelete();
            $table->foreign(['attribute_value_id', 'attribute_id'])
                ->references(['id', 'attribute_id'])
                ->on('attribute_values')
                ->cascadeOnDelete();
        });

        if ($rows !== []) {
            DB::table('variant_attribute_values')->insert($rows);
        }
    }

    private function restoreVariantAttributeValues(): void
    {
        $rows = DB::table('variant_attribute_values')
            ->get(['variant_id', 'attribute_value_id'])
            ->map(fn ($row) => (array) $row)
            ->all();

        Schema::drop('variant_attribute_values');

        Schema::create('variant_attribute_values', function (Blueprint $table) {
            $table->foreignId('variant_id');
            $table->foreignId('attribute_value_id');
            $table->primary(['variant_id', 'attribute_value_id']);
            $table->foreign('variant_id')->references('id')->on('product_variants')->cascadeOnDelete();
            $table->foreign('attribute_value_id')->references('id')->on('attribute_values')->cascadeOnDelete();
        });

        if ($rows !== []) {
            DB::table('variant_attribute_values')->insert($rows);
        }

        Schema::table('attribute_values', function (Blueprint $table) {
            $table->dropUnique(['id', 'attribute_id']);
        });
    }

    private function restrictFinancialForeignKeys(): void
    {
        foreach (self::RESTRICTED_FOREIGN_KEYS as [$tableName, $column, $parent]) {
            Schema::table($tableName, function (Blueprint $table) use ($column) {
                $table->dropForeign([$column]);
            });
            Schema::table($tableName, function (Blueprint $table) use ($column, $parent) {
                $table->foreign($column)->references('id')->on($parent)->restrictOnDelete();
            });
        }
    }

    private function supportsFullText(): bool
    {
        return in_array(DB::getDriverName(), ['mysql', 'mariadb', 'pgsql'], true);
    }

    private function addFullTextIndex(): void
    {
        if ($this->supportsFullText()) {
            Schema::table('products', function (Blueprint $table) {
                $table->fullText(['name', 'description'], 'products_search_fulltext');
            });
        }
    }

    private function dropFullTextIndex(): void
    {
        if ($this->supportsFullText()) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropFullText('products_search_fulltext');
            });
        }
    }

    private function addChecks(): void
    {
        if (! $this->supportsFullText()) {
            return;
        }

        foreach (self::CHECKS as $tableName => $constraints) {
            foreach ($constraints as $name => $expression) {
                DB::statement("alter table {$tableName} add constraint {$name} check ({$expression})");
            }
        }
    }

    private function dropChecks(): void
    {
        if (! $this->supportsFullText()) {
            return;
        }

        $dropClause = DB::getDriverName() === 'pgsql' ? 'drop constraint' : 'drop check';

        foreach (self::CHECKS as $tableName => $constraints) {
            foreach (array_keys($constraints) as $name) {
                DB::statement("alter table {$tableName} {$dropClause} {$name}");
            }
        }
    }
};
