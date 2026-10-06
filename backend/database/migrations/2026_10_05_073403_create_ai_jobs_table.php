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
        Schema::create('ai_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('job_type');
            $table->string('target_entity_type');
            $table->unsignedBigInteger('target_entity_id');
            $table->string('status')->default('pending');
            $table->text('error_message')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['target_entity_type', 'target_entity_id']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_jobs');
    }
};
