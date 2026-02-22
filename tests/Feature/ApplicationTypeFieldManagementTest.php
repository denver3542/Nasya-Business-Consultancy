<?php

use App\Models\ApplicationType;
use App\Models\FormField;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
});

test('admin can view application type fields management page', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $type = ApplicationType::create([
        'name' => 'VisaScreen',
        'slug' => 'visascreen',
        'description' => 'Test',
        'base_fee' => 1200,
        'estimated_processing_days' => 10,
        'form_fields' => [
            ['name' => 'full_name', 'label' => 'Full Name', 'type' => 'text', 'required' => true],
        ],
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)->get(route('admin.application-types.fields.index', $type));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/application-types/fields')
        ->where('applicationType.id', $type->id)
        ->has('legacyFields', 1)
    );
});

test('admin can remove legacy field from application type', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $type = ApplicationType::create([
        'name' => 'NCLEX',
        'slug' => 'nclex',
        'description' => 'Test',
        'base_fee' => 1500,
        'estimated_processing_days' => 7,
        'form_fields' => [
            ['name' => 'full_name', 'label' => 'Full Name', 'type' => 'text', 'required' => true],
            ['name' => 'passport_number', 'label' => 'Passport Number', 'type' => 'text', 'required' => true],
        ],
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)->delete(route('admin.application-types.fields.destroy', $type), [
        'field_name' => 'full_name',
    ]);

    $response->assertRedirect();

    $updatedType = $type->fresh();
    $fieldNames = collect($updatedType->form_fields)->pluck('name')->all();

    expect($fieldNames)->not->toContain('full_name');
    expect($fieldNames)->toContain('passport_number');
});

test('admin can remove relational field from application type', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $type = ApplicationType::create([
        'name' => 'CGFNS',
        'slug' => 'cgfns',
        'description' => 'Test',
        'base_fee' => 1800,
        'estimated_processing_days' => 14,
        'is_active' => true,
    ]);

    $field = FormField::create([
        'name' => 'license_number',
        'label' => 'License Number',
        'type' => 'text',
        'is_active' => true,
    ]);

    $type->formFields()->attach($field->id, [
        'is_required' => true,
        'display_order' => 1,
    ]);

    $response = $this->actingAs($admin)->delete(route('admin.application-types.fields.destroy', $type), [
        'form_field_id' => $field->id,
    ]);

    $response->assertRedirect();
    expect($type->fresh()->formFields()->whereKey($field->id)->exists())->toBeFalse();
});
