<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasColumn('applications', 'form_data')) {
            DB::table('applications')
                ->select(['id', 'form_data', 'custom_fields'])
                ->orderBy('id')
                ->chunkById(200, function ($applications): void {
                    foreach ($applications as $application) {
                        $formData = $this->decodeJsonColumn($application->form_data);
                        $customFields = $this->decodeJsonColumn($application->custom_fields);

                        if ($formData === []) {
                            continue;
                        }

                        $mergedCustomFields = $customFields;
                        foreach ($formData as $key => $value) {
                            if (! array_key_exists($key, $mergedCustomFields)) {
                                $mergedCustomFields[$key] = $value;
                            }
                        }

                        DB::table('applications')
                            ->where('id', $application->id)
                            ->update(['custom_fields' => json_encode($mergedCustomFields)]);
                    }
                });
        }

        Schema::table('applications', function (Blueprint $table) {
            if (Schema::hasColumn('applications', 'form_data')) {
                $table->dropColumn('form_data');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            if (! Schema::hasColumn('applications', 'form_data')) {
                $table->json('form_data')->nullable()->after('assigned_to');
            }
        });

        DB::table('applications')
            ->select(['id', 'custom_fields'])
            ->orderBy('id')
            ->chunkById(200, function ($applications): void {
                foreach ($applications as $application) {
                    $customFields = $this->decodeJsonColumn($application->custom_fields);

                    DB::table('applications')
                        ->where('id', $application->id)
                        ->update(['form_data' => json_encode($customFields)]);
                }
            });
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJsonColumn(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (! is_string($value) || trim($value) === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }
};
