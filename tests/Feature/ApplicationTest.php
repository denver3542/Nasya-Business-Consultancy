<?php

use App\Models\Application;
use App\Models\ApplicationStatus;
use App\Models\ApplicationType;
use App\Models\Service;
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
        ->has('services')
    );
});

test('authenticated users can create a draft application', function () {
    $user = User::factory()->create();
    $user->assignRole('client');
    $service = Service::create([
        'user_id' => $user->id,
        'name' => 'My Service',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user)->post(route('applications.store'), [
        'client_id' => $user->id,
        'service_id' => $service->id,
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
        'service_id' => $service->id,
        'application_type_id' => $this->applicationType->id,
    ]);

    $application = Application::where('user_id', $user->id)->first();
    expect($application->status->slug)->toBe('draft');
    expect($application->submitted_at)->toBeNull();
});

test('authenticated users can submit an application directly', function () {
    $user = User::factory()->create();
    $user->assignRole('client');
    $service = Service::create([
        'user_id' => $user->id,
        'name' => 'My Service',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user)->post(route('applications.store'), [
        'client_id' => $user->id,
        'service_id' => $service->id,
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

test('creating application assigns it to a service stage for board management', function () {
    $user = User::factory()->create();
    $user->assignRole('client');
    $service = Service::create([
        'user_id' => $user->id,
        'name' => 'Board Service',
        'color' => '#3b82f6',
        'position' => 0,
    ]);
    $firstStage = $service->stages()->create([
        'name' => 'To Do',
        'position' => 0,
    ]);
    $service->stages()->create([
        'name' => 'In Progress',
        'position' => 1,
    ]);

    $response = $this->actingAs($user)->post(route('applications.store'), [
        'client_id' => $user->id,
        'service_id' => $service->id,
        'form_data' => [
            'business_name' => 'Board Ready Application',
        ],
        'is_draft' => true,
    ]);

    $response->assertRedirect();

    $application = Application::query()
        ->where('user_id', $user->id)
        ->where('service_id', $service->id)
        ->latest('id')
        ->firstOrFail();

    expect($application->service_stage_id)->toBe($firstStage->id);
    expect($application->service_position)->toBe(1);
});

test('creating application injects selected client profile fields into form data', function () {
    $user = User::factory()->create([
        'name' => 'Client User',
        'email' => 'client@example.com',
        'phone' => '09171234567',
    ]);
    $user->assignRole('client');
    $user->profile()->create([
        'address' => '123 Test St',
        'city' => 'Makati',
        'state' => 'NCR',
        'country' => 'PH',
        'postal_code' => '1200',
        'date_of_birth' => '1995-01-15',
    ]);

    $type = ApplicationType::create([
        'name' => 'Profile + Business',
        'slug' => 'profile-plus-business',
        'description' => 'Requires client and business data',
        'base_fee' => 2000.00,
        'estimated_processing_days' => 3,
        'form_fields' => [
            [
                'name' => 'full_name',
                'label' => 'Full Name',
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'contact_number',
                'label' => 'Contact Number',
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'business_name',
                'label' => 'Business Name',
                'type' => 'text',
                'required' => true,
            ],
        ],
        'required_documents' => [],
        'is_active' => true,
    ]);
    $service = Service::create([
        'user_id' => $user->id,
        'name' => 'Profile Service',
        'color' => '#10b981',
        'position' => 0,
    ]);

    $response = $this->actingAs($user)->post(route('applications.store'), [
        'client_id' => $user->id,
        'service_id' => $service->id,
        'form_data' => [
            'business_name' => 'Integrated Ventures',
        ],
        'is_draft' => false,
    ]);

    $response->assertRedirect();

    $application = Application::query()
        ->where('user_id', $user->id)
        ->where('service_id', $service->id)
        ->firstOrFail();

    expect($application->form_data['business_name'])->toBe('Integrated Ventures');
    expect($application->form_data['name'])->toBe('Client User');
    expect($application->form_data['full_name'])->toBe('Client User');
    expect($application->form_data['contact_number'])->toBe('09171234567');
    expect($application->form_data['email'])->toBe('client@example.com');
    expect($application->form_data['phone'])->toBe('09171234567');
    expect($application->form_data['address'])->toBe('123 Test St');
    expect($application->form_data['city'])->toBe('Makati');
    expect($application->form_data['state'])->toBe('NCR');
    expect($application->form_data['country'])->toBe('PH');
    expect($application->form_data['postal_code'])->toBe('1200');
    expect($application->form_data['date_of_birth'])->toBe('1995-01-15');
});

test('client can create application for service they want to acquire even if service owner differs', function () {
    $client = User::factory()->create();
    $client->assignRole('client');

    $serviceOwner = User::factory()->create();
    $serviceOwner->assignRole('client');

    $service = Service::create([
        'user_id' => $serviceOwner->id,
        'name' => 'Global Visa Service',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($client)->post(route('applications.store'), [
        'client_id' => $client->id,
        'service_id' => $service->id,
        'form_data' => [
            'business_name' => 'Acquire This Service',
        ],
        'is_draft' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('applications', [
        'user_id' => $client->id,
        'service_id' => $service->id,
    ]);
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
