<?php

use App\Models\Application;
use App\Models\ApplicationStatus;
use App\Models\ApplicationType;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Create roles
    Role::create(['name' => 'client', 'guard_name' => 'web']);
    Role::create(['name' => 'staff', 'guard_name' => 'web']);
    Role::create(['name' => 'admin', 'guard_name' => 'web']);

    // Create application statuses
    ApplicationStatus::create([
        'name' => 'Draft',
        'slug' => 'draft',
        'color' => 'gray',
        'is_final' => false,
        'visible_to_client' => true,
    ]);

    ApplicationStatus::create([
        'name' => 'Submitted',
        'slug' => 'submitted',
        'color' => 'blue',
        'is_final' => false,
        'visible_to_client' => true,
    ]);

    ApplicationStatus::create([
        'name' => 'Approved',
        'slug' => 'approved',
        'color' => 'green',
        'is_final' => false,
        'visible_to_client' => true,
    ]);

    ApplicationStatus::create([
        'name' => 'Rejected',
        'slug' => 'rejected',
        'color' => 'red',
        'is_final' => true,
        'visible_to_client' => true,
    ]);

    ApplicationStatus::create([
        'name' => 'Completed',
        'slug' => 'completed',
        'color' => 'green',
        'is_final' => true,
        'visible_to_client' => true,
    ]);

    // Create application type
    $this->applicationType = ApplicationType::create([
        'name' => 'Business Registration',
        'slug' => 'business-registration',
        'description' => 'Register your business',
        'base_fee' => 5000.00,
        'estimated_processing_days' => 7,
        'form_fields' => [
            [
                'name' => 'business_name',
                'label' => 'Business Name',
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'business_address',
                'label' => 'Business Address',
                'type' => 'textarea',
                'required' => true,
            ],
        ],
        'required_documents' => ['DTI Certificate', 'Valid ID'],
        'is_active' => true,
    ]);
});

test('authenticated users can view applications index page', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $response = $this->actingAs($user)->get(route('applications.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('applications/index')
        ->has('applications')
        ->has('filters')
        ->has('types')
        ->has('statuses')
    );
});

test('unauthenticated users cannot view applications index', function () {
    $response = $this->get(route('applications.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can view create application page', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $response = $this->actingAs($user)->get(route('applications.create'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('applications/form')
        ->has('applicationTypes')
    );
});

test('authenticated users can create a draft application', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $response = $this->actingAs($user)->post(route('applications.store'), [
        'application_type_id' => $this->applicationType->id,
        'form_data' => [
            'business_name' => 'Test Business',
            'business_address' => '123 Test St',
        ],
        'client_notes' => 'Test notes',
        'is_draft' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('applications', [
        'user_id' => $user->id,
        'application_type_id' => $this->applicationType->id,
    ]);

    $application = Application::where('user_id', $user->id)->first();
    expect($application->status->slug)->toBe('draft');
    expect($application->submitted_at)->toBeNull();
});

test('authenticated users can submit an application directly', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $response = $this->actingAs($user)->post(route('applications.store'), [
        'application_type_id' => $this->applicationType->id,
        'form_data' => [
            'business_name' => 'Test Business',
            'business_address' => '123 Test St',
        ],
        'is_draft' => false,
    ]);

    $response->assertRedirect();

    $application = Application::where('user_id', $user->id)->first();
    expect($application->status->slug)->toBe('submitted');
    expect($application->submitted_at)->not->toBeNull();
});

test('users can view their own application', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $draftStatus = ApplicationStatus::where('slug', 'draft')->first();

    $application = Application::create([
        'user_id' => $user->id,
        'application_type_id' => $this->applicationType->id,
        'application_status_id' => $draftStatus->id,
        'total_fee' => $this->applicationType->base_fee,
        'form_data' => [],
    ]);

    $response = $this->actingAs($user)->get(route('applications.show', $application));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('applications/show')
        ->has('application')
        ->where('application.id', $application->id)
    );
});

test('users cannot view other users applications', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('client');

    $user2 = User::factory()->create();
    $user2->assignRole('client');

    $draftStatus = ApplicationStatus::where('slug', 'draft')->first();

    $application = Application::create([
        'user_id' => $user1->id,
        'application_type_id' => $this->applicationType->id,
        'application_status_id' => $draftStatus->id,
        'total_fee' => $this->applicationType->base_fee,
        'form_data' => [],
    ]);

    $response = $this->actingAs($user2)->get(route('applications.show', $application));

    $response->assertForbidden();
});

test('users can update their draft applications', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $draftStatus = ApplicationStatus::where('slug', 'draft')->first();

    $application = Application::create([
        'user_id' => $user->id,
        'application_type_id' => $this->applicationType->id,
        'application_status_id' => $draftStatus->id,
        'total_fee' => $this->applicationType->base_fee,
        'form_data' => [],
    ]);

    $response = $this->actingAs($user)->put(route('applications.update', $application), [
        'form_data' => [
            'business_name' => 'Updated Business',
            'business_address' => '456 Updated St',
        ],
        'client_notes' => 'Updated notes',
        'is_draft' => true,
    ]);

    $response->assertRedirect();

    $application->refresh();
    expect($application->form_data['business_name'])->toBe('Updated Business');
    expect($application->client_notes)->toBe('Updated notes');
});

test('users can submit draft applications via update', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $draftStatus = ApplicationStatus::where('slug', 'draft')->first();

    $application = Application::create([
        'user_id' => $user->id,
        'application_type_id' => $this->applicationType->id,
        'application_status_id' => $draftStatus->id,
        'total_fee' => $this->applicationType->base_fee,
        'form_data' => [],
    ]);

    $response = $this->actingAs($user)->put(route('applications.update', $application), [
        'form_data' => [
            'business_name' => 'Test Business',
            'business_address' => '123 Test St',
        ],
        'is_draft' => false,
    ]);

    $response->assertRedirect();

    $application->refresh();
    expect($application->status->slug)->toBe('submitted');
    expect($application->submitted_at)->not->toBeNull();
});

test('users can delete their draft applications', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $draftStatus = ApplicationStatus::where('slug', 'draft')->first();

    $application = Application::create([
        'user_id' => $user->id,
        'application_type_id' => $this->applicationType->id,
        'application_status_id' => $draftStatus->id,
        'total_fee' => $this->applicationType->base_fee,
        'form_data' => [],
    ]);

    $response = $this->actingAs($user)->delete(route('applications.destroy', $application));

    $response->assertRedirect(route('applications.index'));
    $this->assertSoftDeleted('applications', ['id' => $application->id]);
});

test('users cannot delete submitted applications', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $submittedStatus = ApplicationStatus::where('slug', 'submitted')->first();

    $application = Application::create([
        'user_id' => $user->id,
        'application_type_id' => $this->applicationType->id,
        'application_status_id' => $submittedStatus->id,
        'total_fee' => $this->applicationType->base_fee,
        'form_data' => [],
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($user)->delete(route('applications.destroy', $application));

    $response->assertForbidden();
    $this->assertDatabaseHas('applications', ['id' => $application->id, 'deleted_at' => null]);
});

test('staff can approve applications', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $client = User::factory()->create();
    $client->assignRole('client');

    $submittedStatus = ApplicationStatus::where('slug', 'submitted')->first();

    $application = Application::create([
        'user_id' => $client->id,
        'application_type_id' => $this->applicationType->id,
        'application_status_id' => $submittedStatus->id,
        'total_fee' => $this->applicationType->base_fee,
        'form_data' => [],
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($staff)->post(route('applications.approve', $application));

    $response->assertRedirect();

    $application->refresh();
    expect($application->status->slug)->toBe('approved');
});

test('clients cannot approve applications', function () {
    $client = User::factory()->create();
    $client->assignRole('client');

    $submittedStatus = ApplicationStatus::where('slug', 'submitted')->first();

    $application = Application::create([
        'user_id' => $client->id,
        'application_type_id' => $this->applicationType->id,
        'application_status_id' => $submittedStatus->id,
        'total_fee' => $this->applicationType->base_fee,
        'form_data' => [],
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($client)->post(route('applications.approve', $application));

    $response->assertForbidden();
});

test('staff can reject applications', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $client = User::factory()->create();
    $client->assignRole('client');

    $submittedStatus = ApplicationStatus::where('slug', 'submitted')->first();

    $application = Application::create([
        'user_id' => $client->id,
        'application_type_id' => $this->applicationType->id,
        'application_status_id' => $submittedStatus->id,
        'total_fee' => $this->applicationType->base_fee,
        'form_data' => [],
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($staff)->post(route('applications.reject', $application));

    $response->assertRedirect();

    $application->refresh();
    expect($application->status->slug)->toBe('rejected');
});

test('staff can mark applications as complete', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $client = User::factory()->create();
    $client->assignRole('client');

    $approvedStatus = ApplicationStatus::where('slug', 'approved')->first();

    $application = Application::create([
        'user_id' => $client->id,
        'application_type_id' => $this->applicationType->id,
        'application_status_id' => $approvedStatus->id,
        'total_fee' => $this->applicationType->base_fee,
        'form_data' => [],
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($staff)->post(route('applications.complete', $application));

    $response->assertRedirect();

    $application->refresh();
    expect($application->status->slug)->toBe('completed');
});

test('applications index can be filtered by status', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $draftStatus = ApplicationStatus::where('slug', 'draft')->first();
    $submittedStatus = ApplicationStatus::where('slug', 'submitted')->first();

    Application::create([
        'user_id' => $user->id,
        'application_type_id' => $this->applicationType->id,
        'application_status_id' => $draftStatus->id,
        'total_fee' => $this->applicationType->base_fee,
        'form_data' => [],
    ]);

    Application::create([
        'user_id' => $user->id,
        'application_type_id' => $this->applicationType->id,
        'application_status_id' => $submittedStatus->id,
        'total_fee' => $this->applicationType->base_fee,
        'form_data' => [],
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($user)->get(route('applications.index', ['status' => 'draft']));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('applications/index')
        ->where('filters.status', 'draft')
    );
});
