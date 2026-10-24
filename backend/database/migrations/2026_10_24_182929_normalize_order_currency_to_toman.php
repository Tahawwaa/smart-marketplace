<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('currency', 3)->default('IRT')->change();
        });

        // The storefront has always accepted Toman amounts; only their currency label was incorrect.
        DB::table('orders')->where('currency', 'IRR')->update(['currency' => 'IRT']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('currency', 3)->default('IRR')->change();
        });

        DB::table('orders')->where('currency', 'IRT')->update(['currency' => 'IRR']);
    }
};
