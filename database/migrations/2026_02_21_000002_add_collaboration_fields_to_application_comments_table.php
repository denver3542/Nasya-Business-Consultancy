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
        Schema::table('application_comments', function (Blueprint $table) {
            $table->json('likes')->nullable()->after('attachments');
            $table->json('mentions')->nullable()->after('likes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('application_comments', function (Blueprint $table) {
            $table->dropColumn(['likes', 'mentions']);
        });
    }
};
