<?php

use App\Models\Application;
use App\Models\ApplicationStatus;
use App\Models\ApplicationType;
use App\Models\FormField;
use App\Models\Service;
use App\Models\ServiceStage;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::create(['name' => 'client', 'guard_name' => 'web']);
    Role::create(['name' => 'staff', 'guard_name' => 'web']);
    Role::create(['name' => 'admin', 'guard_name' => 'web']);
});

test('authenticated users can view services index page', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $response = $this->actingAs($user)->get(route('client.services.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('services/index')
        ->has('services')
    );
});

test('unauthenticated users cannot view services', function () {
    $response = $this->get(route('client.services.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can create a service', function () {
    $user = User::factory()->create();
    $user->assignRole('client');
    $field = FormField::create([
        'name' => 'passport_number',
        'label' => 'Passport Number',
        'type' => 'text',
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->post(route('client.services.store'), [
        'name' => 'My Test Service',
        'description' => 'A test service description',
        'color' => '#3b82f6',
        'form_field_ids' => [$field->id],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('services', [
        'user_id' => $user->id,
        'name' => 'My Test Service',
        'description' => 'A test service description',
        'color' => '#3b82f6',
    ]);

    $service = Service::where('user_id', $user->id)->first();
    expect($service->stages)->toHaveCount(3);
    expect($service->formFields()->pluck('form_fields.id')->all())->toContain($field->id);
});

test('service creation requires a name', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $response = $this->actingAs($user)->post(route('client.services.store'), [
        'name' => '',
        'color' => '#3b82f6',
    ]);

    $response->assertSessionHasErrors('name');
});

test('users can view their own services', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $service = Service::create([
        'user_id' => $user->id,
        'name' => 'My Service',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user)->get(route('client.services.show', $service));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('services/show')
        ->has('service')
        ->where('service.id', $service->id)
    );
});

test('users cannot view other users services', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('client');

    $user2 = User::factory()->create();
    $user2->assignRole('client');

    $service = Service::create([
        'user_id' => $user1->id,
        'name' => 'User 1 Service',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user2)->get(route('client.services.show', $service));

    $response->assertForbidden();
});

test('users can update their services', function () {
    $user = User::factory()->create();
    $user->assignRole('client');
    $field1 = FormField::create([
        'name' => 'license_number',
        'label' => 'License Number',
        'type' => 'text',
        'is_active' => true,
    ]);
    $field2 = FormField::create([
        'name' => 'school_name',
        'label' => 'School Name',
        'type' => 'text',
        'is_active' => true,
    ]);

    $service = Service::create([
        'user_id' => $user->id,
        'name' => 'Original Name',
        'color' => '#3b82f6',
        'position' => 0,
    ]);
    $service->formFields()->sync([$field1->id]);

    $response = $this->actingAs($user)->patch(route('client.services.update', $service), [
        'name' => 'Updated Name',
        'description' => 'Updated description',
        'form_field_ids' => [$field2->id],
    ]);

    $response->assertRedirect();
    $service->refresh();
    expect($service->name)->toBe('Updated Name');
    expect($service->description)->toBe('Updated description');
    expect($service->formFields()->pluck('form_fields.id')->all())->toBe([$field2->id]);
});

test('same reusable field can be assigned to multiple services', function () {
    $user = User::factory()->create();
    $user->assignRole('client');
    $field = FormField::create([
        'name' => 'birth_place',
        'label' => 'Birth Place',
        'type' => 'text',
        'is_active' => true,
    ]);

    $serviceA = Service::create([
        'user_id' => $user->id,
        'name' => 'Service A',
        'color' => '#3b82f6',
        'position' => 0,
    ]);
    $serviceB = Service::create([
        'user_id' => $user->id,
        'name' => 'Service B',
        'color' => '#10b981',
        'position' => 1,
    ]);

    $serviceA->formFields()->sync([$field->id]);
    $serviceB->formFields()->sync([$field->id]);

    expect($serviceA->formFields()->whereKey($field->id)->exists())->toBeTrue();
    expect($serviceB->formFields()->whereKey($field->id)->exists())->toBeTrue();
});

test('users cannot update other users services', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('client');

    $user2 = User::factory()->create();
    $user2->assignRole('client');

    $service = Service::create([
        'user_id' => $user1->id,
        'name' => 'User 1 Service',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user2)->patch(route('client.services.update', $service), [
        'name' => 'Hacked Name',
    ]);

    $response->assertForbidden();
});

test('users can delete their services', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $service = Service::create([
        'user_id' => $user->id,
        'name' => 'Service to Delete',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user)->delete(route('client.services.destroy', $service));

    $response->assertRedirect(route('client.services.index'));
    $this->assertSoftDeleted('services', ['id' => $service->id]);
});

test('users cannot delete other users services', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('client');

    $user2 = User::factory()->create();
    $user2->assignRole('client');

    $service = Service::create([
        'user_id' => $user1->id,
        'name' => 'User 1 Service',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user2)->delete(route('client.services.destroy', $service));

    $response->assertForbidden();
});

test('users can toggle star on their services', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $service = Service::create([
        'user_id' => $user->id,
        'name' => 'My Service',
        'color' => '#3b82f6',
        'position' => 0,
        'is_starred' => false,
    ]);

    $response = $this->actingAs($user)->post(route('client.services.toggle-star', $service));

    $response->assertRedirect();
    $service->refresh();
    expect($service->is_starred)->toBeTrue();

    $response = $this->actingAs($user)->post(route('client.services.toggle-star', $service));
    $service->refresh();
    expect($service->is_starred)->toBeFalse();
});

test('users can add stages to their services', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $service = Service::create([
        'user_id' => $user->id,
        'name' => 'My Service',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user)->post(route('client.services.stages.store', $service), [
        'name' => 'New Stage',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('service_stages', [
        'service_id' => $service->id,
        'name' => 'New Stage',
    ]);
});

test('users can update stages on their services', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $service = Service::create([
        'user_id' => $user->id,
        'name' => 'My Service',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $stage = ServiceStage::create([
        'service_id' => $service->id,
        'name' => 'Original Stage',
        'position' => 0,
    ]);

    $response = $this->actingAs($user)->patch(
        route('client.services.stages.update', ['service' => $service, 'stage' => $stage]),
        ['name' => 'Updated Stage']
    );

    $response->assertRedirect();
    $stage->refresh();
    expect($stage->name)->toBe('Updated Stage');
});

test('users can delete stages from their services', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $service = Service::create([
        'user_id' => $user->id,
        'name' => 'My Service',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $stage = ServiceStage::create([
        'service_id' => $service->id,
        'name' => 'Stage to Delete',
        'position' => 0,
    ]);

    $response = $this->actingAs($user)->delete(
        route('client.services.stages.destroy', ['service' => $service, 'stage' => $stage])
    );

    $response->assertRedirect();
    $this->assertDatabaseMissing('service_stages', ['id' => $stage->id]);
});

test('users cannot manage stages on other users services', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('client');

    $user2 = User::factory()->create();
    $user2->assignRole('client');

    $service = Service::create([
        'user_id' => $user1->id,
        'name' => 'User 1 Service',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user2)->post(route('client.services.stages.store', $service), [
        'name' => 'Hacked Stage',
    ]);

    $response->assertForbidden();
});

test('users can move applications between service stages and keep positions ordered', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $draftStatus = ApplicationStatus::create([
        'name' => 'Draft',
        'slug' => 'draft',
        'color' => 'gray',
        'is_final' => false,
        'visible_to_client' => true,
    ]);

    $applicationType = ApplicationType::create([
        'name' => 'General',
        'slug' => 'general',
        'description' => 'General application type',
        'base_fee' => 1000,
        'estimated_processing_days' => 3,
        'form_fields' => [],
        'required_documents' => [],
        'is_active' => true,
    ]);

    $service = Service::create([
        'user_id' => $user->id,
        'name' => 'My Service',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $sourceStage = ServiceStage::create([
        'service_id' => $service->id,
        'name' => 'To Do',
        'position' => 0,
    ]);
    $destinationStage = ServiceStage::create([
        'service_id' => $service->id,
        'name' => 'In Progress',
        'position' => 1,
    ]);

    [$movedApplication, $remainingSourceApplication, $destinationExistingApplication] = Application::withoutEvents(
        function () use ($applicationType, $destinationStage, $draftStatus, $service, $sourceStage, $user): array {
            $movedApplication = Application::create([
                'application_number' => 'TEST-MOVE-0001',
                'user_id' => $user->id,
                'application_type_id' => $applicationType->id,
                'application_status_id' => $draftStatus->id,
                'service_id' => $service->id,
                'service_stage_id' => $sourceStage->id,
                'service_position' => 1,
                'total_fee' => 1000,
                'form_data' => [],
            ]);
            $remainingSourceApplication = Application::create([
                'application_number' => 'TEST-MOVE-0002',
                'user_id' => $user->id,
                'application_type_id' => $applicationType->id,
                'application_status_id' => $draftStatus->id,
                'service_id' => $service->id,
                'service_stage_id' => $sourceStage->id,
                'service_position' => 2,
                'total_fee' => 1000,
                'form_data' => [],
            ]);
            $destinationExistingApplication = Application::create([
                'application_number' => 'TEST-MOVE-0003',
                'user_id' => $user->id,
                'application_type_id' => $applicationType->id,
                'application_status_id' => $draftStatus->id,
                'service_id' => $service->id,
                'service_stage_id' => $destinationStage->id,
                'service_position' => 1,
                'total_fee' => 1000,
                'form_data' => [],
            ]);

            return [$movedApplication, $remainingSourceApplication, $destinationExistingApplication];
        }
    );

    $this->actingAs($user)->post(route('client.services.move-application', $service), [
        'application_id' => $movedApplication->id,
        'stage_id' => $destinationStage->id,
        'position' => 1,
    ])->assertRedirect();

    $movedApplication->refresh();
    $remainingSourceApplication->refresh();
    $destinationExistingApplication->refresh();

    expect($movedApplication->service_stage_id)->toBe($destinationStage->id);
    expect($movedApplication->service_position)->toBe(1);
    expect($destinationExistingApplication->service_position)->toBe(2);
    expect($remainingSourceApplication->service_position)->toBe(1);

    $this->actingAs($user)->post(route('client.services.move-application', $service), [
        'application_id' => $movedApplication->id,
        'stage_id' => $destinationStage->id,
        'position' => 2,
    ])->assertRedirect();

    $movedApplication->refresh();
    $destinationExistingApplication->refresh();

    expect($destinationExistingApplication->service_position)->toBe(1);
    expect($movedApplication->service_position)->toBe(2);
});
