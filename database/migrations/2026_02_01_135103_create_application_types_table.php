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
        Schema::create('application_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('base_fee', 10, 2)->default(0);
            $table->json('required_documents')->nullable(); // List of required documents
            $table->json('form_fields')->nullable(); // Dynamic form structure
            $table->json('requirements')->nullable(); // Text requirements/instructions
            $table->integer('estimated_processing_days')->nullable();
            $table->string('icon')->nullable(); // Font Awesome icon class
            $table->string('color')->default('blue'); // Badge color
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('application_types');
    }
};
