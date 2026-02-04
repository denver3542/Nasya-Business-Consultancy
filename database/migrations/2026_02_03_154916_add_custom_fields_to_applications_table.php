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
        Schema::table('applications', function (Blueprint $table) {
            // ClickUp-style features
            $table->integer('priority')->default(0); // 0=none, 1=low, 2=medium, 3=high, 4=urgent
            $table->json('tags')->nullable();
            $table->json('custom_fields')->nullable();
            $table->string('view_preference')->default('list'); // list, board, calendar, table
            $table->integer('position')->default(0); // For drag-and-drop ordering
            $table->boolean('is_starred')->default(false);
            $table->boolean('is_archived')->default(false);
            $table->timestamp('due_date')->nullable();
            $table->timestamp('start_date')->nullable();
            $table->integer('time_estimate')->nullable(); // in hours
            $table->integer('time_tracked')->default(0); // in minutes
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn([
                'priority', 'tags', 'custom_fields', 'view_preference', 
                'position', 'is_starred', 'is_archived', 'due_date', 
                'start_date', 'time_estimate', 'time_tracked'
            ]);
        });
    }
};