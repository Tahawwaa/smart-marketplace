<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const SOFT_DELETE_TABLES = [
        'vendors',
        'products',
        'product_variants',
        'vendor_inventories',
        'orders',
        'sub_orders',
    ];

    private const CHECKS = [
        'vendor_inventories' => [
            'chk_vendor_inventories_reserved' => 'reserved_quantity <= quantity',
            'chk_vendor_inventories_sale_price' => 'sale_price is null or sale_price <= price',
        ],
        'product_reviews' => [
            'chk_product_reviews_rating' => 'rating between 1 and 5',
        ],
        'carts' => [
            'chk_carts_owner' => 'user_id is not null or session_id is not null',
        ],
        'orders' => [
            'chk_orders_status' => "status in ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')",
            'chk_orders_payment_status' => "payment_status in ('pending','paid','failed','refunded','partially_refunded')",
        ],
        'sub_orders' => [
            'chk_sub_orders_status' => "status in ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')",
        ],
        'payments' => [
            'chk_payments_status' => "status in ('pending','paid','failed','refunded')",
        ],
        'shipments' => [
            'chk_shipments_status' => "status in ('pending','shipped','delivered','returned','failed')",
        ],
        'vendors' => [
            'chk_vendors_status' => "status in ('pending','approved','suspended','rejected')",
        ],
        'vendor_payouts' => [
            'chk_vendor_payouts_status' => "status in ('pending','paid','failed')",
        ],
    ];

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('customer')->after('password')->index();
        });

        foreach (self::SOFT_DELETE_TABLES as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        Schema::table('vendors', function (Blueprint $table) {
            $table->string('bank_sheba', 34)->nullable()->after('commission_rate');
            $table->timestamp('approved_at')->nullable()->after('status');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('addresses', function (Blueprint $table) {
            $table->boolean('is_default')->default(false)->after('recipient_phone');
        });

        Schema::table('carts', function (Blueprint $table) {
            $table->timestamp('expires_at')->nullable()->index();
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->decimal('unit_price_snapshot', 14, 2)->nullable()->after('quantity');
        });

        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('discount_type')->default('percent');
            $table->decimal('discount_value', 14, 2);
            $table->decimal('min_order_amount', 14, 2)->default(0);
            $table->decimal('max_discount_amount', 14, 2)->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->foreignId('vendor_id')->nullable()->constrained()->cascadeOnDelete();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('currency', 3)->default('IRR')->after('grand_total');
            $table->decimal('discount_total', 14, 2)->default(0)->after('total_shipping_fee');
            $table->decimal('tax_total', 14, 2)->default(0)->after('discount_total');
            $table->foreignId('coupon_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
        });

        Schema::table('inventory_logs', function (Blueprint $table) {
            $table->integer('quantity_before')->nullable()->after('change_quantity');
            $table->integer('quantity_after')->nullable()->after('quantity_before');
        });

        Schema::table('order_status_histories', function (Blueprint $table) {
            $table->index(['sub_order_id', 'created_at']);
        });

        Schema::create('order_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->foreignId('changed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['order_id', 'created_at']);
        });

        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->restrictOnDelete();
            $table->foreignId('sub_order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('requested_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('amount', 14, 2);
            $table->text('reason')->nullable();
            $table->string('status')->default('pending');
            $table->string('gateway_reference')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->index('status');
        });

        Schema::table('ai_jobs', function (Blueprint $table) {
            $table->json('payload')->nullable();
            $table->json('result')->nullable();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        $this->addChecks();
    }

    public function down(): void
    {
        $this->dropChecks();

        Schema::table('ai_jobs', function (Blueprint $table) {
            $table->dropColumn(['payload', 'result', 'attempts', 'started_at', 'updated_at']);
        });

        Schema::dropIfExists('refunds');
        Schema::dropIfExists('order_histories');

        Schema::table('order_status_histories', function (Blueprint $table) {
            $table->dropIndex(['sub_order_id', 'created_at']);
        });

        Schema::table('inventory_logs', function (Blueprint $table) {
            $table->dropColumn(['quantity_before', 'quantity_after']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('coupon_id');
            $table->dropColumn(['currency', 'discount_total', 'tax_total']);
        });

        Schema::dropIfExists('coupons');

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropColumn('unit_price_snapshot');
        });

        Schema::table('carts', function (Blueprint $table) {
            $table->dropIndex(['expires_at']);
            $table->dropColumn('expires_at');
        });

        Schema::table('addresses', function (Blueprint $table) {
            $table->dropColumn('is_default');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['is_active', 'sort_order', 'created_at', 'updated_at']);
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn(['bank_sheba', 'approved_at']);
        });

        foreach (self::SOFT_DELETE_TABLES as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropColumn('role');
        });
    }

    private function supportsAddingChecks(): bool
    {
        return in_array(DB::getDriverName(), ['mysql', 'mariadb', 'pgsql'], true);
    }

    private function addChecks(): void
    {
        if (! $this->supportsAddingChecks()) {
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
        if (! $this->supportsAddingChecks()) {
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
