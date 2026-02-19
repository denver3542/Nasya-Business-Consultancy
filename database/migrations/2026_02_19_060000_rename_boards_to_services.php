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
        // 1. Drop foreign keys and indexes on applications table first
        Schema::table('applications', function (Blueprint $table) {
            $table->dropForeign(['board_id']);
            $table->dropForeign(['board_list_id']);
            $table->dropIndex(['board_id', 'board_list_id', 'board_position']);
        });

        // 2. Drop foreign key on board_lists referencing boards
        Schema::table('board_lists', function (Blueprint $table) {
            $table->dropForeign(['board_id']);
            $table->dropIndex(['board_id', 'position']);
        });

        // 3. Rename the boards table to services
        Schema::rename('boards', 'services');

        // 4. Rename the board_lists table to service_stages
        Schema::rename('board_lists', 'service_stages');

        // 5. Rename columns in service_stages (formerly board_lists)
        Schema::table('service_stages', function (Blueprint $table) {
            $table->renameColumn('board_id', 'service_id');
        });

        // 6. Re-add foreign key and index on service_stages
        Schema::table('service_stages', function (Blueprint $table) {
            $table->foreign('service_id')->references('id')->on('services')->onDelete('cascade');
            $table->index(['service_id', 'position']);
        });

        // 7. Rename columns in applications table
        Schema::table('applications', function (Blueprint $table) {
            $table->renameColumn('board_id', 'service_id');
            $table->renameColumn('board_list_id', 'service_stage_id');
            $table->renameColumn('board_position', 'service_position');
        });

        // 8. Re-add foreign keys and index on applications
        Schema::table('applications', function (Blueprint $table) {
            $table->foreign('service_id')->references('id')->on('services')->nullOnDelete();
            $table->foreign('service_stage_id')->references('id')->on('service_stages')->nullOnDelete();
            $table->index(['service_id', 'service_stage_id', 'service_position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Drop foreign keys and indexes on applications table
        Schema::table('applications', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropForeign(['service_stage_id']);
            $table->dropIndex(['service_id', 'service_stage_id', 'service_position']);
        });

        // 2. Drop foreign key on service_stages
        Schema::table('service_stages', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropIndex(['service_id', 'position']);
        });

        // 3. Rename columns in applications back
        Schema::table('applications', function (Blueprint $table) {
            $table->renameColumn('service_id', 'board_id');
            $table->renameColumn('service_stage_id', 'board_list_id');
            $table->renameColumn('service_position', 'board_position');
        });

        // 4. Rename columns in service_stages back
        Schema::table('service_stages', function (Blueprint $table) {
            $table->renameColumn('service_id', 'board_id');
        });

        // 5. Rename tables back
        Schema::rename('service_stages', 'board_lists');
        Schema::rename('services', 'boards');

        // 6. Re-add foreign keys and indexes
        Schema::table('board_lists', function (Blueprint $table) {
            $table->foreign('board_id')->references('id')->on('boards')->onDelete('cascade');
            $table->index(['board_id', 'position']);
        });

        Schema::table('applications', function (Blueprint $table) {
            $table->foreign('board_id')->references('id')->on('boards')->nullOnDelete();
            $table->foreign('board_list_id')->references('id')->on('board_lists')->nullOnDelete();
            $table->index(['board_id', 'board_list_id', 'board_position']);
        });
    }
};
