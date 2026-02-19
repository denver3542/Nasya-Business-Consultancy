<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceStageRequest;
use App\Http\Requests\UpdateServiceStageRequest;
use App\Models\Service;
use App\Models\ServiceStage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class ServiceStageController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreServiceStageRequest $request, Service $service): RedirectResponse
    {
        try {
            $maxPosition = $service->stages()->max('position') ?? 0;

            $service->stages()->create([
                'name' => $request->validated('name'),
                'color' => $request->validated('color', '#6b7280'),
                'position' => $maxPosition + 1,
            ]);

            return back()->with('success', 'Stage created successfully.');
        } catch (\Exception $e) {
            return back()
                ->withInput()
                ->with('error', 'Failed to create stage: '.$e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateServiceStageRequest $request, Service $service, ServiceStage $stage): RedirectResponse
    {
        try {
            $stage->update($request->validated());

            return back()->with('success', 'Stage updated successfully.');
        } catch (\Exception $e) {
            return back()
                ->withInput()
                ->with('error', 'Failed to update stage: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Service $service, ServiceStage $stage): RedirectResponse
    {
        $this->authorize('delete', $stage);

        try {
            DB::beginTransaction();

            // Remove applications from this stage (keep them on the service but unassigned to stage)
            $stage->applications()->update([
                'service_stage_id' => null,
                'service_position' => 0,
            ]);

            $stage->delete();

            DB::commit();

            return back()->with('success', 'Stage deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to delete stage: '.$e->getMessage());
        }
    }

    /**
     * Update stage positions (for drag-and-drop reordering).
     */
    public function updatePositions(Service $service): RedirectResponse
    {
        $this->authorize('manageStages', $service);

        $validated = request()->validate([
            'positions' => ['required', 'array'],
            'positions.*.id' => ['required', 'exists:service_stages,id'],
            'positions.*.position' => ['required', 'integer', 'min:0'],
        ]);

        try {
            DB::beginTransaction();

            foreach ($validated['positions'] as $item) {
                ServiceStage::where('id', $item['id'])
                    ->where('service_id', $service->id)
                    ->update(['position' => $item['position']]);
            }

            DB::commit();

            return back()->with('success', 'Stage positions updated.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to update positions.');
        }
    }
}
