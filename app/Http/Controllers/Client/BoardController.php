<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBoardRequest;
use App\Http\Requests\UpdateBoardRequest;
use App\Models\Board;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BoardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $boards = Board::query()
            ->where('user_id', auth()->id())
            ->withCount('lists', 'applications')
            ->ordered()
            ->get();

        return Inertia::render('boards/index', [
            'boards' => $boards,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('boards/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBoardRequest $request): RedirectResponse
    {
        try {
            DB::beginTransaction();

            $maxPosition = Board::where('user_id', auth()->id())->max('position') ?? 0;

            $board = Board::create([
                'user_id' => auth()->id(),
                'name' => $request->validated('name'),
                'description' => $request->validated('description'),
                'color' => $request->validated('color', '#3b82f6'),
                'position' => $maxPosition + 1,
            ]);

            // Create default lists
            $defaultLists = ['To Do', 'In Progress', 'Done'];
            foreach ($defaultLists as $index => $listName) {
                $board->lists()->create([
                    'name' => $listName,
                    'position' => $index,
                ]);
            }

            DB::commit();

            return to_route('client.boards.show', $board)
                ->with('success', 'Board created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->withInput()
                ->with('error', 'Failed to create board: '.$e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Board $board): Response
    {
        $this->authorize('view', $board);

        $board->load([
            'lists' => fn ($query) => $query->ordered()->withCount('applications'),
            'lists.applications' => fn ($query) => $query
                ->orderBy('board_position')
                ->with(['applicationType', 'status', 'assignedStaff', 'watchers']),
        ]);

        // Get user's applications that can be added to boards
        $availableApplications = auth()->user()->applications()
            ->whereNull('board_id')
            ->with(['applicationType', 'status'])
            ->latest()
            ->limit(50)
            ->get();

        return Inertia::render('boards/show', [
            'board' => $board,
            'availableApplications' => $availableApplications,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Board $board): Response
    {
        $this->authorize('update', $board);

        return Inertia::render('boards/edit', [
            'board' => $board,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBoardRequest $request, Board $board): RedirectResponse
    {
        try {
            $board->update($request->validated());

            return back()->with('success', 'Board updated successfully.');
        } catch (\Exception $e) {
            return back()
                ->withInput()
                ->with('error', 'Failed to update board: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Board $board): RedirectResponse
    {
        $this->authorize('delete', $board);

        try {
            DB::beginTransaction();

            // Remove applications from board (don't delete them)
            $board->applications()->update([
                'board_id' => null,
                'board_list_id' => null,
                'board_position' => 0,
            ]);

            $board->delete();

            DB::commit();

            return to_route('client.boards.index')
                ->with('success', 'Board deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to delete board: '.$e->getMessage());
        }
    }

    /**
     * Toggle starred status for the board.
     */
    public function toggleStar(Board $board): RedirectResponse
    {
        $this->authorize('update', $board);

        $board->update(['is_starred' => ! $board->is_starred]);

        return back()->with('success', $board->is_starred ? 'Board starred.' : 'Board unstarred.');
    }

    /**
     * Update board positions (for drag-and-drop reordering).
     */
    public function updatePositions(): RedirectResponse
    {
        $validated = request()->validate([
            'positions' => ['required', 'array'],
            'positions.*.id' => ['required', 'exists:boards,id'],
            'positions.*.position' => ['required', 'integer', 'min:0'],
        ]);

        try {
            DB::beginTransaction();

            foreach ($validated['positions'] as $item) {
                Board::where('id', $item['id'])
                    ->where('user_id', auth()->id())
                    ->update(['position' => $item['position']]);
            }

            DB::commit();

            return back()->with('success', 'Board positions updated.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to update positions.');
        }
    }

    /**
     * Add an application to a board list.
     */
    public function addApplication(Board $board): RedirectResponse
    {
        $this->authorize('addApplication', $board);

        $validated = request()->validate([
            'application_id' => ['required', 'exists:applications,id'],
            'list_id' => ['required', 'exists:board_lists,id'],
        ]);

        try {
            $application = auth()->user()->applications()->findOrFail($validated['application_id']);
            $list = $board->lists()->findOrFail($validated['list_id']);

            $maxPosition = $list->applications()->max('board_position') ?? 0;

            $application->update([
                'board_id' => $board->id,
                'board_list_id' => $list->id,
                'board_position' => $maxPosition + 1,
            ]);

            return back()->with('success', 'Application added to board.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to add application: '.$e->getMessage());
        }
    }

    /**
     * Remove an application from the board.
     */
    public function removeApplication(Board $board): RedirectResponse
    {
        $this->authorize('update', $board);

        $validated = request()->validate([
            'application_id' => ['required', 'exists:applications,id'],
        ]);

        try {
            $application = $board->applications()->findOrFail($validated['application_id']);

            $application->update([
                'board_id' => null,
                'board_list_id' => null,
                'board_position' => 0,
            ]);

            return back()->with('success', 'Application removed from board.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to remove application: '.$e->getMessage());
        }
    }

    /**
     * Move an application between lists or update position.
     */
    public function moveApplication(Board $board): RedirectResponse
    {
        $this->authorize('update', $board);

        $validated = request()->validate([
            'application_id' => ['required', 'exists:applications,id'],
            'list_id' => ['required', 'exists:board_lists,id'],
            'position' => ['required', 'integer', 'min:0'],
        ]);

        try {
            DB::beginTransaction();

            $application = $board->applications()->findOrFail($validated['application_id']);
            $newList = $board->lists()->findOrFail($validated['list_id']);

            // Update the application's list and position
            $application->update([
                'board_list_id' => $newList->id,
                'board_position' => $validated['position'],
            ]);

            // Reorder other applications in the list
            $newList->applications()
                ->where('id', '!=', $application->id)
                ->where('board_position', '>=', $validated['position'])
                ->increment('board_position');

            DB::commit();

            return back()->with('success', 'Application moved successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to move application: '.$e->getMessage());
        }
    }
}
