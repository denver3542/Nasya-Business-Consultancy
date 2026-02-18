<?php

use App\Http\Controllers\Admin\FormFieldController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Client\ApplicationController;
use App\Http\Controllers\Client\BoardController;
use App\Http\Controllers\Client\BoardListController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Application routes (authenticated users)
Route::middleware(['auth', 'verified'])->group(function () {

    // Application management actions
    Route::get('applications/settings', [ApplicationController::class, 'settings'])
        ->name('applications.settings');
    Route::post('applications/settings', [ApplicationController::class, 'updateSettings'])
        ->name('applications.update-settings');
        
    Route::resource('applications', ApplicationController::class);
x
    // Application workflow actions
    Route::post('applications/{application}/approve', [ApplicationController::class, 'approve'])
        ->name('applications.approve');
    Route::post('applications/{application}/reject', [ApplicationController::class, 'reject'])
        ->name('applications.reject');
    Route::post('applications/{application}/complete', [ApplicationController::class, 'complete'])
        ->name('applications.complete');

    // Route::post('applications/settings', [ApplicationController::class, 'updateSettings'])
    // ->name('applications.update-settings');
    Route::post('applications/{application}/toggle-star', [ApplicationController::class, 'toggleStar'])
        ->name('applications.toggle-star');
    Route::post('applications/{application}/update-position', [ApplicationController::class, 'updatePosition'])
        ->name('applications.update-position');
    Route::post('applications/{application}/update-priority', [ApplicationController::class, 'updatePriority'])
        ->name('applications.update-priority');
    Route::post('applications/{application}/update-due-date', [ApplicationController::class, 'updateDueDate'])
        ->name('applications.update-due-date');
    Route::post('applications/{application}/archive', [ApplicationController::class, 'archive'])
        ->name('applications.archive');

    // Application tags
    Route::post('applications/{application}/add-tag', [ApplicationController::class, 'addTag'])
        ->name('applications.add-tag');
    Route::post('applications/{application}/remove-tag', [ApplicationController::class, 'removeTag'])
        ->name('applications.remove-tag');

    // Application collaboration
    Route::post('applications/{application}/add-comment', [ApplicationController::class, 'addComment'])
        ->name('applications.add-comment');
    Route::post('applications/{application}/toggle-watcher', [ApplicationController::class, 'toggleWatcher'])
        ->name('applications.toggle-watcher');

    // Bulk actions
    Route::post('applications/bulk-action', [ApplicationController::class, 'bulkAction'])
        ->name('applications.bulk-action');
});

// Client routes (boards)
Route::middleware(['auth', 'verified'])->prefix('client')->name('client.')->group(function () {
    // Boards
    Route::resource('boards', BoardController::class);
    Route::post('boards/{board}/toggle-star', [BoardController::class, 'toggleStar'])
        ->name('boards.toggle-star');
    Route::post('boards/update-positions', [BoardController::class, 'updatePositions'])
        ->name('boards.update-positions');
    Route::post('boards/{board}/add-application', [BoardController::class, 'addApplication'])
        ->name('boards.add-application');
    Route::post('boards/{board}/remove-application', [BoardController::class, 'removeApplication'])
        ->name('boards.remove-application');
    Route::post('boards/{board}/move-application', [BoardController::class, 'moveApplication'])
        ->name('boards.move-application');

    // Board Lists
    Route::post('boards/{board}/lists', [BoardListController::class, 'store'])
        ->name('boards.lists.store');
    Route::patch('boards/{board}/lists/{list}', [BoardListController::class, 'update'])
        ->name('boards.lists.update');
    Route::delete('boards/{board}/lists/{list}', [BoardListController::class, 'destroy'])
        ->name('boards.lists.destroy');
    Route::post('boards/{board}/lists/update-positions', [BoardListController::class, 'updatePositions'])
        ->name('boards.lists.update-positions');
});

// Admin routes
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('users', UserController::class);
    Route::post('users/{user}/toggle-status', [UserController::class, 'toggleStatus'])
        ->name('users.toggle-status');

    Route::resource('form-fields', FormFieldController::class);
    Route::post('form-fields/{form_field}/toggle-status', [FormFieldController::class, 'toggleStatus'])
        ->name('form-fields.toggle-status');
});

require __DIR__.'/settings.php';