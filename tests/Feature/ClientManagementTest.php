<?php

use App\Models\Application;
use App\Models\ApplicationStatus;
use App\Models\ApplicationType;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'client', 'guard_name' => 'web']);
});

it('admin can list clients', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $client = User::factory()->create();
    $client->assignRole('client');

    $response = $this->actingAs($admin)->get(route('clients.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('clients/index')
        ->has('clients.data', 1)
        ->where('clients.data.0.id', $client->id)
    );
});

it('admin can create and soft delete a client', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $createResponse = $this->actingAs($admin)->post(route('clients.store'), [
        'name' => 'New Client',
        'email' => 'new-client@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'phone' => '123456',
        'is_active' => true,
        'profile' => [
            'address' => '123 Test St',
        ],
    ]);

    $createResponse->assertRedirect(route('clients.index'));
    $this->assertDatabaseHas('users', ['email' => 'new-client@example.com']);

    $client = User::query()->where('email', 'new-client@example.com')->firstOrFail();
    expect($client->hasRole('client'))->toBeTrue();

    $deleteResponse = $this->actingAs($admin)->delete(route('clients.destroy', $client));
    $deleteResponse->assertRedirect(route('clients.index'));

    $this->assertSoftDeleted('users', ['id' => $client->id]);
});

it('client show page includes associated applications', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $client = User::factory()->create();
    $client->assignRole('client');

    $status = ApplicationStatus::create([
        'name' => 'Draft',
        'slug' => 'draft',
        'color' => 'gray',
        'is_final' => false,
        'visible_to_client' => true,
    ]);

    $type = ApplicationType::create([
        'name' => 'Test Type',
        'slug' => 'test-type',
        'description' => 'Test',
        'base_fee' => 1000,
        'estimated_processing_days' => 1,
        'is_active' => true,
    ]);

    $application = Application::create([
        'user_id' => $client->id,
        'application_type_id' => $type->id,
        'application_status_id' => $status->id,
        'total_fee' => 1000,
        'form_data' => [],
    ]);

    $response = $this->actingAs($admin)->get(route('clients.show', $client));
    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('clients/show')
        ->where('client.id', $client->id)
        ->where('client.applications.0.id', $application->id)
    );
});
