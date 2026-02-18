<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBoardListRequest;
use App\Http\Requests\UpdateBoardListRequest;
use App\Models\Board;
use App\Models\BoardList;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class BoardListController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBoardListRequest $request, Board $board): RedirectResponse
    {
        try {
            $maxPosition = $board->lists()->max('position') ?? 0;

            $board->lists()->create([
                'name' => $request->validated('name'),
                'color' => $request->validated('color', '#6b7280'),
                'position' => $maxPosition + 1,
            ]);

            return back()->with('success', 'List created successfully.');
        } catch (\Exception $e) {
            return back()
                ->withInput()
                ->with('error', 'Failed to create list: '.$e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBoardListRequest $request, Board $board, BoardList $list): RedirectResponse
    {
        try {
            $list->update($request->validated());

            return back()->with('success', 'List updated successfully.');
        } catch (\Exception $e) {
            return back()
                ->withInput()
                ->with('error', 'Failed to update list: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Board $board, BoardList $list): RedirectResponse
    {
        $this->authorize('delete', $list);

        try {
            DB::beginTransaction();

            // Remove applications from this list (keep them on the board but unassigned to list)
            $list->applications()->update([
                'board_list_id' => null,
                'board_position' => 0,
            ]);

            $list->delete();

            DB::commit();

            return back()->with('success', 'List deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to delete list: '.$e->getMessage());
        }
    }

    /**
     * Update list positions (for drag-and-drop reordering).
     */
    public function updatePositions(Board $board): RedirectResponse
    {
        $this->authorize('manageLists', $board);

        $validated = request()->validate([
            'positions' => ['required', 'array'],
            'positions.*.id' => ['required', 'exists:board_lists,id'],
            'positions.*.position' => ['required', 'integer', 'min:0'],
        ]);

        try {
            DB::beginTransaction();

            foreach ($validated['positions'] as $item) {
                BoardList::where('id', $item['id'])
                    ->where('board_id', $board->id)
                    ->update(['position' => $item['position']]);
            }

            DB::commit();

            return back()->with('success', 'List positions updated.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to update positions.');
        }
    }
}
