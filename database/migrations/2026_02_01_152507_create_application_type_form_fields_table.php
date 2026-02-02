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
        Schema::create('application_type_form_field', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('form_field_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_required')->default(false);
            $table->integer('display_order')->default(0);
            $table->string('section')->nullable();
            $table->timestamps();

            $table->unique(['application_type_id', 'form_field_id'], 'app_type_form_field_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('application_type_form_field');
    }
};
