<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ApplicationType;
use App\Models\ApplicationStatus;
use App\Models\ApplicationView;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ApplicationController extends Controller
{
    /**
     * Display applications in ClickUp-style views
     */
    public function index(Request $request)
    {
        $viewType = $request->get('view', 'list'); // list, board, calendar, table
        
        $query = auth()->user()->applications()
            ->with(['applicationType', 'status', 'assignedStaff', 'watchers'])
            ->active() // Not archived
            ->latest();

        // Apply filters
        $this->applyFilters($query, $request);

        // Get data based on view type
        switch ($viewType) {
            case 'board':
                return $this->boardView($query, $request);
            case 'calendar':
                return $this->calendarView($query, $request);
            case 'table':
                return $this->tableView($query, $request);
            default:
                return $this->listView($query, $request);
        }
    }

    /**
     * List view (default)
     */
    protected function listView($query, $request)
    {
        // Get grouping option
        $groupBy = $request->get('group_by');
        
        // Get sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        // Apply sorting
        $this->applySorting($query, $sortBy, $sortOrder);
        
        if ($groupBy) {
            $applications = $this->groupApplications($query->get(), $groupBy);
        } else {
            $applications = $query->paginate(50);
        }

        return Inertia::render('applications/ListView', [
            'applications' => $applications,
            'filters' => $this->getFilters(),
            'stats' => $this->getStats(),
            'groupBy' => $groupBy,
            'sortBy' => $sortBy,
            'sortOrder' => $sortOrder,
        ]);
    }

    protected function applySorting($query, $sortBy, $sortOrder)
    {
        switch ($sortBy) {
            case 'application_number':
                $query->orderBy('application_number', $sortOrder);
                break;
            case 'type':
                $query->join('application_types', 'applications.application_type_id', '=', 'application_types.id')
                    ->orderBy('application_types.name', $sortOrder)
                    ->select('applications.*');
                break;
            case 'status':
                $query->join('application_statuses', 'applications.application_status_id', '=', 'application_statuses.id')
                    ->orderBy('application_statuses.display_order', $sortOrder)
                    ->select('applications.*');
                break;
            case 'priority':
                $query->orderBy('priority', $sortOrder);
                break;
            case 'due_date':
                $query->orderBy('due_date', $sortOrder);
                break;
            case 'completion':
                $query->orderBy('completion_percentage', $sortOrder);
                break;
            case 'total_fee':
                $query->orderBy('total_fee', $sortOrder);
                break;
            default:
                $query->orderBy('created_at', $sortOrder);
        }
        
        return $query;
    }

    protected function groupApplications($applications, $groupBy)
    {
        return $applications->groupBy(function($app) use ($groupBy) {
            switch ($groupBy) {
                case 'status':
                    return $app->status->name;
                case 'priority':
                    return $app->priority_label;
                case 'type':
                    return $app->applicationType->name;
                case 'assigned':
                    return $app->assignedStaff ? $app->assignedStaff->name : 'Unassigned';
                default:
                    return 'All';
            }
        })->map(function($group) {
            return $group->values();
        });
    }

    /**
     * Board view (Kanban)
     */
    protected function boardView($query, $request)
    {
        $statuses = ApplicationStatus::visibleToClient()->get();
        
        $board = [];
        foreach ($statuses as $status) {
            $board[$status->slug] = $query->clone()
                ->where('application_status_id', $status->id)
                ->orderBy('position')
                ->get();
        }

        return Inertia::render('Client/Applications/BoardView', [
            'board' => $board,
            'statuses' => $statuses,
            'filters' => $this->getFilters(),
            'savedViews' => $this->getSavedViews(),
        ]);
    }

    /**
     * Calendar view
     */
    protected function calendarView($query, $request)
    {
        $applications = $query->whereNotNull('due_date')->get();

        return Inertia::render('Client/Applications/CalendarView', [
            'applications' => $applications,
            'filters' => $this->getFilters(),
            'savedViews' => $this->getSavedViews(),
        ]);
    }

    /**
     * Table view (spreadsheet-like)
     */
    protected function tableView($query, $request)
    {
        $applications = $query->paginate(50);

        return Inertia::render('Applications/TableView', [
            'applications' => $applications,
            'filters' => $this->getFilters(),
            'savedViews' => $this->getSavedViews(),
            'columns' => $this->getTableColumns(),
        ]);
    }

    /**
     * Apply filters to query
     */
    protected function applyFilters($query, $request)
    {
        // Status filter
        if ($request->filled('status')) {
            $query->whereHas('status', function($q) use ($request) {
                $q->where('slug', $request->status);
            });
        }

        // Type filter
        if ($request->filled('type')) {
            $query->where('application_type_id', $request->type);
        }

        // Priority filter
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        // Tags filter
        if ($request->filled('tags')) {
            $tags = is_array($request->tags) ? $request->tags : [$request->tags];
            $query->where(function($q) use ($tags) {
                foreach ($tags as $tag) {
                    $q->orWhereJsonContains('tags', $tag);
                }
            });
        }

        // Assigned filter
        if ($request->filled('assigned')) {
            $query->where('assigned_to', $request->assigned);
        }

        // Date filters
        if ($request->filled('due_date_filter')) {
            switch ($request->due_date_filter) {
                case 'overdue':
                    $query->overdue();
                    break;
                case 'today':
                    $query->dueToday();
                    break;
                case 'this_week':
                    $query->dueThisWeek();
                    break;
            }
        }

        // Starred filter
        if ($request->boolean('starred')) {
            $query->starred();
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('application_number', 'like', "%{$search}%")
                  ->orWhereHas('applicationType', function($subQ) use ($search) {
                      $subQ->where('name', 'like', "%{$search}%");
                  });
            });
        }

        return $query;
    }

    /**
     * Get filter options
     */
    protected function getFilters()
    {
        return [
            'types' => ApplicationType::active()->get(),
            'statuses' => ApplicationStatus::visibleToClient()->get(),
            'priorities' => [
                ['value' => 0, 'label' => 'None'],
                ['value' => 1, 'label' => 'Low'],
                ['value' => 2, 'label' => 'Medium'],
                ['value' => 3, 'label' => 'High'],
                ['value' => 4, 'label' => 'Urgent'],
            ],
            'dueDateOptions' => [
                ['value' => 'overdue', 'label' => 'Overdue'],
                ['value' => 'today', 'label' => 'Due Today'],
                ['value' => 'this_week', 'label' => 'Due This Week'],
            ],
        ];
    }

    /**
     * Get saved views
     */
    protected function getSavedViews()
    {
        return auth()->user()->applicationViews()
            ->orderBy('position')
            ->get();
    }

    /**
     * Get statistics
     */
    protected function getStats()
    {
        $user = auth()->user();

        return [
            'total' => $user->applications()->active()->count(),
            'pending' => $user->applications()->pending()->count(),
            'overdue' => $user->applications()->overdue()->count(),
            'due_today' => $user->applications()->dueToday()->count(),
            'starred' => $user->applications()->starred()->count(),
        ];
    }

    /**
     * Get table columns configuration
     */
    protected function getTableColumns()
    {
        return [
            ['key' => 'application_number', 'label' => 'Number', 'sortable' => true],
            ['key' => 'type', 'label' => 'Type', 'sortable' => true],
            ['key' => 'status', 'label' => 'Status', 'sortable' => true],
            ['key' => 'priority', 'label' => 'Priority', 'sortable' => true],
            ['key' => 'due_date', 'label' => 'Due Date', 'sortable' => true],
            ['key' => 'assigned_to', 'label' => 'Assigned To', 'sortable' => false],
            ['key' => 'completion', 'label' => 'Progress', 'sortable' => true],
            ['key' => 'created_at', 'label' => 'Created', 'sortable' => true],
        ];
    }

    /**
     * Update application position (drag and drop)
     */
    public function updatePosition(Request $request, Application $application)
    {
        $this->authorize('update', $application);

        $request->validate([
            'position' => 'required|integer',
            'status_id' => 'nullable|exists:application_statuses,id',
        ]);

        DB::beginTransaction();
        try {
            // Update status if changed (board view)
            if ($request->filled('status_id') && $request->status_id != $application->application_status_id) {
                $application->update([
                    'application_status_id' => $request->status_id,
                ]);

                $application->addToTimeline(
                    'status_changed',
                    "Status changed to {$application->status->name}"
                );
            }

            // Update position
            $application->update(['position' => $request->position]);

            DB::commit();

            return response()->json([
                'success' => true,
                'application' => $application->load(['status', 'applicationType']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to update position'], 500);
        }
    }

    /**
     * Toggle star
     */
    public function toggleStar(Application $application)
    {
        $this->authorize('update', $application);

        $isStarred = $application->toggleStar();

        return response()->json([
            'success' => true,
            'is_starred' => $isStarred,
        ]);
    }

    /**
     * Update priority
     */
    public function updatePriority(Request $request, Application $application)
    {
        $this->authorize('update', $application);

        $request->validate([
            'priority' => 'required|integer|between:0,4',
        ]);

        $application->update(['priority' => $request->priority]);

        $application->addToTimeline(
            'priority_changed',
            "Priority changed to {$application->priority_label}"
        );

        return response()->json([
            'success' => true,
            'application' => $application,
        ]);
    }

    /**
     * Update due date
     */
    public function updateDueDate(Request $request, Application $application)
    {
        $this->authorize('update', $application);

        $request->validate([
            'due_date' => 'nullable|date',
        ]);

        $application->update(['due_date' => $request->due_date]);

        if ($request->due_date) {
            $application->addToTimeline(
                'due_date_set',
                "Due date set to {$application->due_date->format('M d, Y')}"
            );
        } else {
            $application->addToTimeline(
                'due_date_removed',
                "Due date removed"
            );
        }

        return response()->json([
            'success' => true,
            'application' => $application,
        ]);
    }

    /**
     * Add tag
     */
    public function addTag(Request $request, Application $application)
    {
        $this->authorize('update', $application);

        $request->validate([
            'tag' => 'required|string|max:50',
        ]);

        $tags = $application->tags ?? [];
        
        if (!in_array($request->tag, $tags)) {
            $tags[] = $request->tag;
            $application->update(['tags' => $tags]);
        }

        return response()->json([
            'success' => true,
            'tags' => $tags,
        ]);
    }

    /**
     * Remove tag
     */
    public function removeTag(Request $request, Application $application)
    {
        $this->authorize('update', $application);

        $request->validate([
            'tag' => 'required|string',
        ]);

        $tags = $application->tags ?? [];
        $tags = array_values(array_filter($tags, fn($t) => $t !== $request->tag));
        
        $application->update(['tags' => $tags]);

        return response()->json([
            'success' => true,
            'tags' => $tags,
        ]);
    }

    /**
     * Add comment
     */
    public function addComment(Request $request, Application $application)
    {
        $this->authorize('view', $application);

        $request->validate([
            'comment' => 'required|string',
            'parent_id' => 'nullable|exists:application_comments,id',
        ]);

        $comment = $application->addComment(
            $request->comment,
            auth()->user(),
            $request->parent_id
        );

        return response()->json([
            'success' => true,
            'comment' => $comment->load('user'),
        ]);
    }

    /**
     * Toggle watcher
     */
    public function toggleWatcher(Application $application)
    {
        $this->authorize('view', $application);

        $user = auth()->user();

        if ($application->isWatchedBy($user)) {
            $application->removeWatcher($user);
            $watching = false;
        } else {
            $application->addWatcher($user);
            $watching = true;
        }

        return response()->json([
            'success' => true,
            'watching' => $watching,
        ]);
    }

    /**
     * Archive application
     */
    public function archive(Application $application)
    {
        $this->authorize('update', $application);

        $application->archive();

        return response()->json([
            'success' => true,
            'message' => 'Application archived successfully',
        ]);
    }

    /**
     * Bulk operations
     */
    public function bulkAction(Request $request)
    {
        $request->validate([
            'action' => 'required|in:archive,delete,update_status,update_priority,add_tag',
            'application_ids' => 'required|array',
            'application_ids.*' => 'exists:applications,id',
            'value' => 'nullable',
        ]);

        $applications = Application::whereIn('id', $request->application_ids)
            ->where('user_id', auth()->id())
            ->get();

        foreach ($applications as $application) {
            switch ($request->action) {
                case 'archive':
                    $application->archive();
                    break;
                case 'delete':
                    if ($application->status->slug === 'draft') {
                        $application->delete();
                    }
                    break;
                case 'update_status':
                    $application->update(['application_status_id' => $request->value]);
                    break;
                case 'update_priority':
                    $application->update(['priority' => $request->value]);
                    break;
                case 'add_tag':
                    $tags = $application->tags ?? [];
                    if (!in_array($request->value, $tags)) {
                        $tags[] = $request->value;
                        $application->update(['tags' => $tags]);
                    }
                    break;
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Bulk action completed successfully',
        ]);
    }

    // ... existing methods (store, show, edit, update, submit, destroy)
}