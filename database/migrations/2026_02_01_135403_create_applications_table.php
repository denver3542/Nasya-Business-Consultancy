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
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->string('application_number')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('application_type_id')->constrained();
            $table->foreignId('application_status_id')->constrained();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();

            // Form data stored as JSON
            $table->json('form_data')->nullable();

            // Application metadata
            $table->decimal('total_fee', 10, 2)->default(0);
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->boolean('is_paid')->default(false);

            // Notes and tracking
            $table->text('client_notes')->nullable();
            $table->text('staff_notes')->nullable();
            $table->text('rejection_reason')->nullable();

            // Progress tracking
            $table->integer('completion_percentage')->default(0);

            // Important dates
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('deadline')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes for performance
            $table->index('application_number');
            $table->index('user_id');
            $table->index('application_status_id');
            $table->index('assigned_to');
            $table->index('submitted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
