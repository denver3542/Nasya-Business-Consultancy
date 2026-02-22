<?php

use App\Mail\ApplicationUpdateMail;
use App\Models\Application;
use App\Models\ApplicationComment;
use App\Models\ApplicationStatus;
use App\Models\ApplicationType;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'client', 'guard_name' => 'web']);

    $this->status = ApplicationStatus::create([
        'name' => 'Draft',
        'slug' => 'draft',
        'color' => 'gray',
        'is_final' => false,
        'visible_to_client' => true,
    ]);

    $this->type = ApplicationType::create([
        'name' => 'Test Type',
        'slug' => 'test-type',
        'description' => 'Test',
        'base_fee' => 1000,
        'estimated_processing_days' => 1,
        'is_active' => true,
    ]);
});

it('client can add reply and like comments', function () {
    $client = User::factory()->create();
    $client->assignRole('client');

    $application = Application::create([
        'user_id' => $client->id,
        'application_type_id' => $this->type->id,
        'application_status_id' => $this->status->id,
        'total_fee' => 1000,
        'form_data' => [],
    ]);

    $createResponse = $this->actingAs($client)->post(route('applications.add-comment', $application), [
        'comment' => 'Top level comment',
    ]);
    $createResponse->assertSuccessful();

    $topComment = ApplicationComment::query()->where('application_id', $application->id)->firstOrFail();

    $replyResponse = $this->actingAs($client)->post(route('applications.add-comment', $application), [
        'comment' => 'Reply comment',
        'parent_id' => $topComment->id,
    ]);
    $replyResponse->assertSuccessful();

    $likeResponse = $this->actingAs($client)->post(route('applications.comments.toggle-like', [
        'application' => $application,
        'comment' => $topComment,
    ]));
    $likeResponse->assertSuccessful();

    $topComment->refresh();
    expect($topComment->likes)->toContain($client->id);
});

it('client can upload and delete application documents', function () {
    Storage::fake('local');

    $client = User::factory()->create();
    $client->assignRole('client');

    $application = Application::create([
        'user_id' => $client->id,
        'application_type_id' => $this->type->id,
        'application_status_id' => $this->status->id,
        'total_fee' => 1000,
        'form_data' => [],
    ]);

    $uploadResponse = $this->actingAs($client)->post(route('applications.documents.upload', $application), [
        'files' => [
            UploadedFile::fake()->create('test.pdf', 120),
        ],
    ]);

    $uploadResponse->assertSuccessful();
    $this->assertDatabaseCount('application_documents', 1);

    $documentId = $application->documents()->firstOrFail()->id;
    $deleteResponse = $this->actingAs($client)->delete(route('applications.documents.delete', [
        'application' => $application,
        'document' => $documentId,
    ]));

    $deleteResponse->assertSuccessful();
    $this->assertDatabaseCount('application_documents', 0);
});

it('staff can sync watchers update dates and send email', function () {
    Mail::fake();

    $client = User::factory()->create();
    $client->assignRole('client');

    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $watcher = User::factory()->create();
    $watcher->assignRole('staff');

    $application = Application::create([
        'user_id' => $client->id,
        'application_type_id' => $this->type->id,
        'application_status_id' => $this->status->id,
        'total_fee' => 1000,
        'form_data' => [],
    ]);

    $watchersResponse = $this->actingAs($staff)->post(route('applications.watchers.sync', $application), [
        'watcher_ids' => [$watcher->id],
    ]);
    $watchersResponse->assertSuccessful();
    expect($application->refresh()->watchers()->pluck('users.id')->all())->toContain($watcher->id);

    $datesResponse = $this->actingAs($staff)->post(route('applications.update-dates', $application), [
        'due_date' => now()->addDays(5)->toDateString(),
        'start_date' => now()->toDateString(),
    ]);
    $datesResponse->assertSuccessful();

    $mailResponse = $this->actingAs($staff)->post(route('applications.send-email', $application), [
        'template' => 'approved',
    ]);
    $mailResponse->assertSuccessful();

    Mail::assertSent(ApplicationUpdateMail::class);
});
