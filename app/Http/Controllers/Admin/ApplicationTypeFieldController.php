<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\RemoveApplicationTypeFieldRequest;
use App\Models\ApplicationType;
use App\Models\FormField;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationTypeFieldController extends Controller
{
    public function index(ApplicationType $applicationType): Response
    {
        $applicationType->load(['formFields.options']);

        $relationalFields = $applicationType->formFields
            ->map(function (FormField $field): array {
                return [
                    'source' => 'relational',
                    'id' => $field->id,
                    'name' => $field->name,
                    'label' => $field->label,
                    'type' => $field->type,
                    'required' => (bool) $field->pivot?->is_required,
                    'section' => $field->pivot?->section,
                    'options' => $field->options
                        ->map(fn ($option): array => [
                            'label' => $option->label,
                            'value' => $option->value,
                        ])->values()->all(),
                ];
            })
            ->values()
            ->all();

        $legacyFields = collect($applicationType->form_fields ?? [])
            ->map(function (array $field): array {
                return [
                    'source' => 'legacy',
                    'id' => null,
                    'name' => $field['name'] ?? '',
                    'label' => $field['label'] ?? ($field['name'] ?? ''),
                    'type' => $field['type'] ?? 'text',
                    'required' => (bool) ($field['required'] ?? false),
                    'section' => null,
                    'options' => $this->normalizeLegacyOptions($field['options'] ?? []),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('admin/application-types/fields', [
            'applicationType' => [
                'id' => $applicationType->id,
                'name' => $applicationType->name,
                'slug' => $applicationType->slug,
            ],
            'relationalFields' => $relationalFields,
            'legacyFields' => $legacyFields,
        ]);
    }

    public function destroy(RemoveApplicationTypeFieldRequest $request, ApplicationType $applicationType): RedirectResponse
    {
        $validated = $request->validated();
        $removed = false;

        if (! empty($validated['form_field_id'])) {
            $removed = $applicationType->formFields()->detach($validated['form_field_id']) > 0 || $removed;
        }

        if (! empty($validated['field_name'])) {
            $legacyFields = collect($applicationType->form_fields ?? []);
            $updatedLegacyFields = $legacyFields
                ->reject(fn (array $field): bool => ($field['name'] ?? null) === $validated['field_name'])
                ->values()
                ->all();

            if (count($updatedLegacyFields) !== $legacyFields->count()) {
                $applicationType->update(['form_fields' => $updatedLegacyFields]);
                $removed = true;
            }
        }

        if (! $removed) {
            return back()->with('error', 'Field not found on this application type.');
        }

        return back()->with('success', 'Field removed from application type.');
    }

    /**
     * @param  array<int|string, mixed>  $options
     * @return array<int, array{label: string, value: string}>
     */
    protected function normalizeLegacyOptions(array $options): array
    {
        if (array_is_list($options)) {
            return collect($options)
                ->map(function ($option): array {
                    if (is_array($option)) {
                        return [
                            'label' => (string) ($option['label'] ?? $option['value'] ?? ''),
                            'value' => (string) ($option['value'] ?? ''),
                        ];
                    }

                    return [
                        'label' => (string) $option,
                        'value' => (string) $option,
                    ];
                })
                ->values()
                ->all();
        }

        return collect($options)
            ->map(fn ($label, $value): array => ['label' => (string) $label, 'value' => (string) $value])
            ->values()
            ->all();
    }
}
