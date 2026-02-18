<?php

use App\Models\Board;
use App\Models\BoardList;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::create(['name' => 'client', 'guard_name' => 'web']);
    Role::create(['name' => 'staff', 'guard_name' => 'web']);
    Role::create(['name' => 'admin', 'guard_name' => 'web']);
});

test('authenticated users can view boards index page', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $response = $this->actingAs($user)->get(route('client.boards.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('boards/index')
        ->has('boards')
        ->has('starredBoards')
    );
});

test('unauthenticated users cannot view boards', function () {
    $response = $this->get(route('client.boards.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can create a board', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $response = $this->actingAs($user)->post(route('client.boards.store'), [
        'name' => 'My Test Board',
        'description' => 'A test board description',
        'color' => '#3b82f6',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('boards', [
        'user_id' => $user->id,
        'name' => 'My Test Board',
        'description' => 'A test board description',
        'color' => '#3b82f6',
    ]);

    $board = Board::where('user_id', $user->id)->first();
    expect($board->lists)->toHaveCount(3);
});

test('board creation requires a name', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $response = $this->actingAs($user)->post(route('client.boards.store'), [
        'name' => '',
        'color' => '#3b82f6',
    ]);

    $response->assertSessionHasErrors('name');
});

test('users can view their own boards', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $board = Board::create([
        'user_id' => $user->id,
        'name' => 'My Board',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user)->get(route('client.boards.show', $board));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('boards/show')
        ->has('board')
        ->where('board.id', $board->id)
    );
});

test('users cannot view other users boards', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('client');

    $user2 = User::factory()->create();
    $user2->assignRole('client');

    $board = Board::create([
        'user_id' => $user1->id,
        'name' => 'User 1 Board',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user2)->get(route('client.boards.show', $board));

    $response->assertForbidden();
});

test('users can update their boards', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $board = Board::create([
        'user_id' => $user->id,
        'name' => 'Original Name',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user)->patch(route('client.boards.update', $board), [
        'name' => 'Updated Name',
        'description' => 'Updated description',
    ]);

    $response->assertRedirect();
    $board->refresh();
    expect($board->name)->toBe('Updated Name');
    expect($board->description)->toBe('Updated description');
});

test('users cannot update other users boards', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('client');

    $user2 = User::factory()->create();
    $user2->assignRole('client');

    $board = Board::create([
        'user_id' => $user1->id,
        'name' => 'User 1 Board',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user2)->patch(route('client.boards.update', $board), [
        'name' => 'Hacked Name',
    ]);

    $response->assertForbidden();
});

test('users can delete their boards', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $board = Board::create([
        'user_id' => $user->id,
        'name' => 'Board to Delete',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user)->delete(route('client.boards.destroy', $board));

    $response->assertRedirect(route('client.boards.index'));
    $this->assertSoftDeleted('boards', ['id' => $board->id]);
});

test('users cannot delete other users boards', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('client');

    $user2 = User::factory()->create();
    $user2->assignRole('client');

    $board = Board::create([
        'user_id' => $user1->id,
        'name' => 'User 1 Board',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user2)->delete(route('client.boards.destroy', $board));

    $response->assertForbidden();
});

test('users can toggle star on their boards', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $board = Board::create([
        'user_id' => $user->id,
        'name' => 'My Board',
        'color' => '#3b82f6',
        'position' => 0,
        'is_starred' => false,
    ]);

    $response = $this->actingAs($user)->post(route('client.boards.toggle-star', $board));

    $response->assertRedirect();
    $board->refresh();
    expect($board->is_starred)->toBeTrue();

    $response = $this->actingAs($user)->post(route('client.boards.toggle-star', $board));
    $board->refresh();
    expect($board->is_starred)->toBeFalse();
});

test('users can add lists to their boards', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $board = Board::create([
        'user_id' => $user->id,
        'name' => 'My Board',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user)->post(route('client.boards.lists.store', $board), [
        'name' => 'New List',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('board_lists', [
        'board_id' => $board->id,
        'name' => 'New List',
    ]);
});

test('users can update lists on their boards', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $board = Board::create([
        'user_id' => $user->id,
        'name' => 'My Board',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $list = BoardList::create([
        'board_id' => $board->id,
        'name' => 'Original List',
        'position' => 0,
    ]);

    $response = $this->actingAs($user)->patch(
        route('client.boards.lists.update', ['board' => $board, 'list' => $list]),
        ['name' => 'Updated List']
    );

    $response->assertRedirect();
    $list->refresh();
    expect($list->name)->toBe('Updated List');
});

test('users can delete lists from their boards', function () {
    $user = User::factory()->create();
    $user->assignRole('client');

    $board = Board::create([
        'user_id' => $user->id,
        'name' => 'My Board',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $list = BoardList::create([
        'board_id' => $board->id,
        'name' => 'List to Delete',
        'position' => 0,
    ]);

    $response = $this->actingAs($user)->delete(
        route('client.boards.lists.destroy', ['board' => $board, 'list' => $list])
    );

    $response->assertRedirect();
    $this->assertDatabaseMissing('board_lists', ['id' => $list->id]);
});

test('users cannot manage lists on other users boards', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('client');

    $user2 = User::factory()->create();
    $user2->assignRole('client');

    $board = Board::create([
        'user_id' => $user1->id,
        'name' => 'User 1 Board',
        'color' => '#3b82f6',
        'position' => 0,
    ]);

    $response = $this->actingAs($user2)->post(route('client.boards.lists.store', $board), [
        'name' => 'Hacked List',
    ]);

    $response->assertForbidden();
});
