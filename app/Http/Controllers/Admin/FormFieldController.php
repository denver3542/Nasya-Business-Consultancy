<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFormFieldRequest;
use App\Http\Requests\UpdateFormFieldRequest;
use App\Models\FormField;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class FormFieldController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = FormField::query()->withCount('options');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('label', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('status')) {
            $isActive = $request->input('status') === 'active';
            $query->where('is_active', $isActive);
        }

        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $formFields = $query->paginate(15)->withQueryString();

        return Inertia::render('admin/form-fields/index', [
            'formFields' => $formFields,
            'filters' => $request->only(['search', 'type', 'status', 'sort', 'direction']),
            'fieldTypes' => $this->getFieldTypes(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('admin/form-fields/form', [
            'formField' => null,
            'fieldTypes' => $this->getFieldTypes(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreFormFieldRequest $request): RedirectResponse
    {
        DB::beginTransaction();

        try {
            $formField = FormField::create($request->only([
                'name',
                'label',
                'type',
                'placeholder',
                'help_text',
                'is_active',
            ]));

            if ($request->has('options') && $formField->requiresOptions()) {
                $this->syncOptions($formField, $request->input('options', []));
            }

            DB::commit();

            Log::info('Form field created successfully.', ['form_field_id' => $formField->id]);
            return to_route('admin.form-fields.index')
                ->with('success', 'Form field created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to create form field: '.$e->getMessage());
            return back()
                ->withInput()
                ->with('error', 'Failed to create form field: '.$e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(FormField $formField): Response
    {
        $formField->load(['options', 'applicationTypes']);

        return Inertia::render('admin/form-fields/show', [
            'formField' => $formField,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(FormField $formField): Response
    {
        $formField->load('options');

        return Inertia::render('admin/form-fields/form', [
            'formField' => $formField,
            'fieldTypes' => $this->getFieldTypes(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateFormFieldRequest $request, FormField $formField): RedirectResponse
    {
        DB::beginTransaction();

        try {
            $formField->update($request->only([
                'name',
                'label',
                'type',
                'placeholder',
                'help_text',
                'validation_rules',
                'is_active',
            ]));

            if ($formField->requiresOptions()) {
                $this->syncOptions($formField, $request->input('options', []));
            } else {
                $formField->options()->delete();
            }

            DB::commit();

            return to_route('admin.form-fields.index')
                ->with('success', 'Form field updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->withInput()
                ->with('error', 'Failed to update form field: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(FormField $formField): RedirectResponse
    {
        try {
            $formField->delete();

            return to_route('admin.form-fields.index')
                ->with('success', 'Form field deleted successfully.');
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Failed to delete form field: '.$e->getMessage());
        }
    }

    /**
     * Toggle form field active status.
     */
    public function toggleStatus(FormField $formField): RedirectResponse
    {
        try {
            $formField->update(['is_active' => ! $formField->is_active]);

            $status = $formField->is_active ? 'activated' : 'deactivated';

            return back()
                ->with('success', "Form field {$status} successfully.");
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Failed to update form field status: '.$e->getMessage());
        }
    }

    /**
     * Get available field types.
     *
     * @return array<int, array{value: string, label: string}>
     */
    private function getFieldTypes(): array
    {
        return [
            ['value' => 'text', 'label' => 'Text'],
            ['value' => 'email', 'label' => 'Email'],
            ['value' => 'number', 'label' => 'Number'],
            ['value' => 'textarea', 'label' => 'Textarea'],
            ['value' => 'select', 'label' => 'Select Dropdown'],
            ['value' => 'date', 'label' => 'Date'],
            ['value' => 'file', 'label' => 'File Upload'],
            ['value' => 'checkbox', 'label' => 'Checkbox'],
            ['value' => 'radio', 'label' => 'Radio Buttons'],
        ];
    }

    /**
     * Sync options for a form field.
     *
     * @param  array<int, array{label: string, value: string}>  $options
     */
    private function syncOptions(FormField $formField, array $options): void
    {
        $formField->options()->delete();

        foreach ($options as $index => $option) {
            if (! empty($option['label']) && ! empty($option['value'])) {
                $formField->options()->create([
                    'label' => $option['label'],
                    'value' => $option['value'],
                    'display_order' => $index,
                ]);
            }
        }
    }
}