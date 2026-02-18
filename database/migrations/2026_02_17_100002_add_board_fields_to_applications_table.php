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
            $table->foreignId('board_id')->nullable()->after('position')->constrained()->nullOnDelete();
            $table->foreignId('board_list_id')->nullable()->after('board_id')->constrained()->nullOnDelete();
            $table->integer('board_position')->default(0)->after('board_list_id');

            $table->index(['board_id', 'board_list_id', 'board_position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropForeign(['board_id']);
            $table->dropForeign(['board_list_id']);
            $table->dropIndex(['board_id', 'board_list_id', 'board_position']);
            $table->dropColumn(['board_id', 'board_list_id', 'board_position']);
        });
    }
};
