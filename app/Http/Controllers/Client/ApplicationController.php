<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ApplicationStatus;
use App\Models\ApplicationType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    /**
     * Display a listing of the user's applications
     */
    public function index(Request $request): Response
    {
        $query = auth()->user()->applications()
            ->with(['applicationType', 'status', 'user', 'assignedStaff'])
            ->latest();

        // Filter by status
        if ($request->filled('status')) {
            $query->whereHas('status', function ($q) use ($request) {
                $q->where('slug', $request->status);
            });
        }

        // Filter by type
        if ($request->filled('type')) {
            $typeSlug = $request->type;
            $query->whereHas('applicationType', function ($q) use ($typeSlug) {
                $q->where('slug', $typeSlug);
            });
        }

        // Date range filters
        if ($request->filled('date_from')) {
            $query->whereDate('submitted_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('submitted_at', '<=', $request->date_to);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('application_number', 'like', "%{$search}%")
                    ->orWhereHas('applicationType', function ($subQ) use ($search) {
                        $subQ->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $applications = $query->paginate(15)->withQueryString();

        // Get filter options
        $types = ApplicationType::active()->get(['id', 'name', 'slug']);
        $statuses = ApplicationStatus::visibleToClient()->get(['id', 'name', 'slug', 'color']);

        return Inertia::render('applications/index', [
            'applications' => $applications,
            'filters' => $request->only(['search', 'status', 'type', 'date_from', 'date_to']),
            'types' => $types,
            'statuses' => $statuses,
        ]);
    }

    /**
     * Show the form for creating a new application
     */
    public function create(): Response
    {
        $applicationTypes = ApplicationType::active()
            ->with(['formFields.options'])
            ->get(['id', 'name', 'slug', 'description', 'base_fee', 'form_fields', 'required_documents'])
            ->map(function (ApplicationType $type) {
                $type->form_fields_array = $type->form_fields_array;

                return $type;
            });

        return Inertia::render('applications/form', [
            'applicationTypes' => $applicationTypes,
        ]);
    }

    /**
     * Store a newly created application
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'application_type_id' => 'required|exists:application_types,id',
            'form_data' => 'nullable|array',
            'client_notes' => 'nullable|string|max:5000',
            'is_draft' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            $applicationType = ApplicationType::findOrFail($validated['application_type_id']);

            // Determine status based on is_draft flag
            $isDraft = $validated['is_draft'] ?? true;
            $statusSlug = $isDraft ? 'draft' : 'submitted';
            $status = ApplicationStatus::where('slug', $statusSlug)->firstOrFail();

            $application = Application::create([
                'user_id' => auth()->id(),
                'application_type_id' => $applicationType->id,
                'application_status_id' => $status->id,
                'total_fee' => $applicationType->base_fee,
                'form_data' => $validated['form_data'] ?? [],
                'client_notes' => $validated['client_notes'] ?? null,
                'submitted_at' => $isDraft ? null : now(),
            ]);

            // Update completion percentage
            $application->updateCompletionPercentage();

            // Add to timeline
            $action = $isDraft ? 'created' : 'submitted';
            $description = $isDraft ? 'Application created as draft' : 'Application submitted for review';
            $application->addToTimeline($action, $description);

            DB::commit();

            if ($isDraft) {
                return redirect()
                    ->route('applications.edit', $application)
                    ->with('success', 'Application saved as draft.');
            }

            return redirect()
                ->route('applications.show', $application)
                ->with('success', 'Application submitted successfully! Our team will review it shortly.');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to create application. Please try again.')
                ->withInput();
        }
    }

    /**
     * Display the specified application
     */
    public function show(Application $application): Response
    {
        $this->authorize('view', $application);

        $application->load([
            'applicationType',
            'status',
            'user',
            'assignedStaff',
            'documents',
            'timeline.user',
            'payments',
        ]);

        // Determine permissions for action buttons
        $canEdit = auth()->user()->can('update', $application) && $application->can_edit;
        $canApprove = auth()->user()->can('approve', $application);
        $canReject = auth()->user()->can('reject', $application);
        $canComplete = auth()->user()->can('complete', $application);

        return Inertia::render('applications/show', [
            'application' => $application,
            'canEdit' => $canEdit,
            'canApprove' => $canApprove,
            'canReject' => $canReject,
            'canComplete' => $canComplete,
        ]);
    }

    /**
     * Show the form for editing the application
     */
    public function edit(Application $application): Response
    {
        $this->authorize('update', $application);

        if (! $application->can_edit) {
            return redirect()
                ->route('applications.show', $application)
                ->with('error', 'This application can no longer be edited.');
        }

        $application->load([
            'applicationType.formFields.options',
            'status',
            'documents',
            'payments',
        ]);

        $applicationTypes = ApplicationType::active()
            ->with(['formFields.options'])
            ->get(['id', 'name', 'slug', 'description', 'base_fee', 'form_fields', 'required_documents'])
            ->map(function (ApplicationType $type) {
                $type->form_fields_array = $type->form_fields_array;

                return $type;
            });

        return Inertia::render('applications/form', [
            'application' => $application,
            'applicationTypes' => $applicationTypes,
        ]);
    }

    /**
     * Update the specified application
     */
    public function update(Request $request, Application $application)
    {
        $this->authorize('update', $application);

        if (! $application->can_edit) {
            return redirect()
                ->route('applications.show', $application)
                ->with('error', 'This application can no longer be edited.');
        }

        $validated = $request->validate([
            'form_data' => 'nullable|array',
            'client_notes' => 'nullable|string|max:5000',
            'is_draft' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            $isDraft = $validated['is_draft'] ?? true;

            // Update form data
            $application->update([
                'form_data' => $validated['form_data'] ?? [],
                'client_notes' => $validated['client_notes'] ?? null,
            ]);

            // If submitting (not draft), update status and submitted_at
            if (! $isDraft && $application->status->slug === 'draft') {
                $submittedStatus = ApplicationStatus::where('slug', 'submitted')->firstOrFail();
                $application->update([
                    'application_status_id' => $submittedStatus->id,
                    'submitted_at' => now(),
                ]);

                $application->addToTimeline(
                    'submitted',
                    'Application submitted for review'
                );
            } else {
                $application->addToTimeline(
                    'updated',
                    'Application information updated'
                );
            }

            // Update completion percentage
            $application->updateCompletionPercentage();

            DB::commit();

            if (! $isDraft) {
                return redirect()
                    ->route('applications.show', $application)
                    ->with('success', 'Application submitted successfully!');
            }

            return back()->with('success', 'Application updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to update application. Please try again.')
                ->withInput();
        }
    }

    /**
     * Approve the application (staff only)
     */
    public function approve(Application $application)
    {
        $this->authorize('approve', $application);

        try {
            DB::beginTransaction();

            $approvedStatus = ApplicationStatus::where('slug', 'approved')->firstOrFail();

            $application->update([
                'application_status_id' => $approvedStatus->id,
            ]);

            $application->addToTimeline(
                'approved',
                'Application approved by '.auth()->user()->name
            );

            DB::commit();

            // TODO: Send notification to client

            return back()->with('success', 'Application approved successfully!');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to approve application. Please try again.');
        }
    }

    /**
     * Reject the application (staff only)
     */
    public function reject(Application $application)
    {
        $this->authorize('reject', $application);

        try {
            DB::beginTransaction();

            $rejectedStatus = ApplicationStatus::where('slug', 'rejected')->firstOrFail();

            $application->update([
                'application_status_id' => $rejectedStatus->id,
            ]);

            $application->addToTimeline(
                'rejected',
                'Application rejected by '.auth()->user()->name
            );

            DB::commit();

            // TODO: Send notification to client

            return back()->with('success', 'Application rejected.');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to reject application. Please try again.');
        }
    }

    /**
     * Mark application as complete (staff only)
     */
    public function complete(Application $application)
    {
        $this->authorize('complete', $application);

        try {
            DB::beginTransaction();

            $completedStatus = ApplicationStatus::where('slug', 'completed')->firstOrFail();

            $application->update([
                'application_status_id' => $completedStatus->id,
            ]);

            $application->addToTimeline(
                'completed',
                'Application marked as complete by '.auth()->user()->name
            );

            DB::commit();

            // TODO: Send notification to client

            return back()->with('success', 'Application marked as complete!');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to complete application. Please try again.');
        }
    }

    /**
     * Delete/cancel the application
     */
    public function destroy(Application $application)
    {
        $this->authorize('delete', $application);

        if ($application->status->slug !== 'draft') {
            return back()->with('error', 'Only draft applications can be deleted.');
        }

        try {
            $application->delete();

            return redirect()
                ->route('applications.index')
                ->with('success', 'Application deleted successfully.');

        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete application. Please try again.');
        }
    }
}
