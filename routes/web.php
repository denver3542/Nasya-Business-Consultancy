<?php

use App\Http\Controllers\Admin\FormFieldController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Client\ApplicationController;
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
    Route::resource('applications', ApplicationController::class);
    Route::post('applications/{application}/approve', [ApplicationController::class, 'approve'])
        ->name('applications.approve');
    Route::post('applications/{application}/reject', [ApplicationController::class, 'reject'])
        ->name('applications.reject');
    Route::post('applications/{application}/complete', [ApplicationController::class, 'complete'])
        ->name('applications.complete');
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
