<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendApplicationEmailRequest;
use App\Http\Requests\StoreApplicationCommentRequest;
use App\Http\Requests\SyncApplicationWatchersRequest;
use App\Http\Requests\UpdateApplicationDatesRequest;
use App\Http\Requests\UploadApplicationDocumentsRequest;
use App\Mail\ApplicationUpdateMail;
use App\Models\Application;
use App\Models\ApplicationComment;
use App\Models\ApplicationDocument;
use App\Models\User;
use App\Notifications\ApplicationWatcherChangedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

class ApplicationCollaborationController extends Controller
{
    public function addComment(StoreApplicationCommentRequest $request, Application $application): JsonResponse
    {
        $this->authorize('view', $application);

        $attachmentPaths = [];
        foreach ($request->file('attachments', []) as $file) {
            $attachmentPaths[] = $file->store("applications/{$application->id}/comments", 'local');
        }

        $comment = $application->allComments()->create([
            'user_id' => $request->user()->id,
            'comment' => $request->string('comment')->toString(),
            'parent_id' => $request->input('parent_id'),
            'attachments' => $attachmentPaths,
            'mentions' => $request->input('mention_user_ids', []),
            'likes' => [],
        ]);

        $action = $comment->parent_id ? 'comment_reply_added' : 'comment_added';
        $application->addToTimeline(
            $action,
            $comment->parent_id ? 'Reply added to a comment' : 'Comment added to the application'
        );

        return response()->json([
            'success' => true,
            'comment' => $comment->load(['user', 'replies.user']),
        ]);
    }

    public function deleteComment(Application $application, ApplicationComment $comment): JsonResponse
    {
        $this->authorize('view', $application);

        abort_unless($comment->application_id === $application->id, 404);

        $user = auth()->user();
        $canDelete = $comment->user_id === $user->id || $user->hasAnyRole(['admin', 'staff']);
        abort_unless($canDelete, 403);

        foreach ($comment->attachments ?? [] as $attachmentPath) {
            if (Storage::disk('local')->exists($attachmentPath)) {
                Storage::disk('local')->delete($attachmentPath);
            }
        }

        $comment->delete();

        $application->addToTimeline('comment_deleted', 'A comment was deleted');

        return response()->json(['success' => true]);
    }

    public function toggleCommentLike(Application $application, ApplicationComment $comment): JsonResponse
    {
        $this->authorize('view', $application);

        abort_unless($comment->application_id === $application->id, 404);

        $likes = $comment->likes ?? [];
        $userId = auth()->id();

        if (in_array($userId, $likes, true)) {
            $likes = array_values(array_filter($likes, fn ($id): bool => $id !== $userId));
        } else {
            $likes[] = $userId;
        }

        $comment->update(['likes' => $likes]);

        return response()->json([
            'success' => true,
            'likes_count' => count($likes),
            'liked' => in_array($userId, $likes, true),
        ]);
    }

    public function uploadDocuments(UploadApplicationDocumentsRequest $request, Application $application): JsonResponse
    {
        $this->authorize('view', $application);

        $documents = [];
        foreach ($request->file('files', []) as $file) {
            $path = $file->store("applications/{$application->id}/documents", 'local');

            $documents[] = ApplicationDocument::create([
                'application_id' => $application->id,
                'document_type' => $request->input('document_type', 'Supporting Document'),
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'file_type' => $file->getClientOriginalExtension(),
                'file_size' => $file->getSize(),
                'verification_status' => 'pending',
                'version' => 1,
            ]);
        }

        $application->addToTimeline(
            'document_uploaded',
            count($documents).' document(s) uploaded'
        );

        return response()->json([
            'success' => true,
            'documents' => collect($documents)->map->toArray(),
        ]);
    }

    public function deleteDocument(Application $application, ApplicationDocument $document): JsonResponse
    {
        $this->authorize('view', $application);
        abort_unless($document->application_id === $application->id, 404);

        $document->deleteFile();
        $document->delete();

        $application->addToTimeline('document_deleted', 'A document was removed');

        return response()->json(['success' => true]);
    }

    public function downloadDocument(Application $application, ApplicationDocument $document)
    {
        $this->authorize('view', $application);
        abort_unless($document->application_id === $application->id, 404);

        abort_unless(Storage::disk('local')->exists($document->file_path), 404);

        return Storage::disk('local')->download($document->file_path, $document->file_name);
    }

    public function syncWatchers(SyncApplicationWatchersRequest $request, Application $application): JsonResponse
    {
        $this->authorize('view', $application);

        $watcherIds = User::query()
            ->whereIn('id', $request->input('watcher_ids', []))
            ->role(['admin', 'staff'])
            ->pluck('id')
            ->all();

        $existingWatcherIds = $application->watchers()->pluck('users.id')->all();

        $added = array_values(array_diff($watcherIds, $existingWatcherIds));
        $removed = array_values(array_diff($existingWatcherIds, $watcherIds));

        $application->watchers()->sync($watcherIds);

        if ($added !== []) {
            Notification::send(
                User::query()->whereIn('id', $added)->get(),
                new ApplicationWatcherChangedNotification($application, 'added')
            );
        }

        if ($removed !== []) {
            Notification::send(
                User::query()->whereIn('id', $removed)->get(),
                new ApplicationWatcherChangedNotification($application, 'removed')
            );
        }

        $application->addToTimeline(
            'watchers_updated',
            'Watchers updated on the application',
            ['added' => $added, 'removed' => $removed]
        );

        return response()->json([
            'success' => true,
            'watchers' => $application->watchers()->get(['users.id', 'users.name', 'users.email']),
        ]);
    }

    public function updateDates(UpdateApplicationDatesRequest $request, Application $application): JsonResponse
    {
        $this->authorize('view', $application);

        $validated = $request->validated();
        $application->update($validated);

        $application->addToTimeline(
            'dates_updated',
            'Important application dates were updated',
            $validated
        );

        return response()->json([
            'success' => true,
            'application' => $application->refresh(),
        ]);
    }

    public function sendEmail(SendApplicationEmailRequest $request, Application $application): JsonResponse
    {
        $this->authorize('view', $application);

        $template = $request->string('template')->toString();
        $subject = $request->input('subject');
        $message = $request->input('message');

        Mail::to($application->user->email)->send(new ApplicationUpdateMail($application, $template, $subject, $message));

        $application->addToTimeline(
            'email_sent',
            "Email sent to client using {$template} template"
        );

        return response()->json(['success' => true]);
    }
}
