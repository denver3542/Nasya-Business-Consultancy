<?php

namespace App\Actions\Legacy;

use Illuminate\Support\Str;

class LegacyApplicationTransformer
{
    /**
     * @param  array<string, mixed>  $dynamicRow
     * @return array<string, mixed>
     */
    public function buildFormData(array $dynamicRow): array
    {
        $formData = [];

        foreach ($dynamicRow as $column => $value) {
            if (in_array($column, ['id', 'task_id'], true)) {
                continue;
            }

            $normalizedKey = $this->normalizeFieldKey($column);
            $formData[$normalizedKey] = $this->normalizeValue($value);
        }

        ksort($formData);

        return $formData;
    }

    public function normalizeFieldKey(string $column): string
    {
        $key = Str::of($column)
            ->lower()
            ->replaceMatches('/[^a-z0-9_]+/', '_')
            ->replaceMatches('/_+/', '_')
            ->trim('_')
            ->value();

        return $key !== '' ? $key : 'field_'.Str::random(8);
    }

    public function normalizeValue(mixed $value): mixed
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            $trimmed = trim($value);

            if ($trimmed === '' || strtolower($trimmed) === 'null' || $trimmed === '0000-00-00' || $trimmed === '0000-00-00 00:00:00') {
                return null;
            }

            return $trimmed;
        }

        return $value;
    }

    public function mapPriority(?string $legacyPriority): int
    {
        if ($legacyPriority === null) {
            return 0;
        }

        $normalized = strtolower(trim($legacyPriority));

        return match (true) {
            str_starts_with($normalized, 'a') => 1,
            str_starts_with($normalized, 'b') => 2,
            str_starts_with($normalized, 'c') => 3,
            str_starts_with($normalized, 'd') => 4,
            default => 0,
        };
    }

    public function generateApplicationNumber(string $applicationTypeSlug, int $legacyTaskId): string
    {
        return sprintf('APP-%s-%d', strtoupper(Str::slug($applicationTypeSlug, '-')), $legacyTaskId);
    }

    /**
     * @return array<int, string>
     */
    public function parseCsvIds(?string $csv): array
    {
        if ($csv === null || trim($csv) === '') {
            return [];
        }

        return collect(explode(',', $csv))
            ->map(fn (string $value): string => trim($value))
            ->filter(fn (string $value): bool => $value !== '' && ctype_digit($value))
            ->unique()
            ->values()
            ->all();
    }
}
