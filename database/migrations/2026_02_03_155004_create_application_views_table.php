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
        Schema::create('application_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name'); // "My Applications", "Urgent Items", etc.
            $table->string('type'); // list, board, calendar, table, timeline
            $table->json('filters')->nullable(); // Status, type, priority, etc.
            $table->json('sort')->nullable();
            $table->json('group_by')->nullable();
            $table->json('visible_fields')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_shared')->default(false);
            $table->integer('position')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('application_views');
    }
};