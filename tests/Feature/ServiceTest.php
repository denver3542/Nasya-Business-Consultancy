<?php

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

    $response = $this->actingAs($user)->post(route('client.services.store'), [
        'name' => 'My Test Service',
        'description' => 'A test service description',
        'color' => '#3b82f6',
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

    $service = Service::create([
        'user_id' => $user->id,
        'name' => 'Original Name',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user)->patch(route('client.services.update', $service), [
        'name' => 'Updated Name',
        'description' => 'Updated description',
    ]);

    $response->assertRedirect();
    $service->refresh();
    expect($service->name)->toBe('Updated Name');
    expect($service->description)->toBe('Updated description');
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
