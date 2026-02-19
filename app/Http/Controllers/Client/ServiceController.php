<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $services = Service::query()
            ->where('user_id', auth()->id())
            ->withCount(['stages', 'applications'])
            ->ordered()
            ->get();

        return Inertia::render('services/index', [
            'services' => $services,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('services/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreServiceRequest $request): RedirectResponse
    {
        try {
            DB::beginTransaction();

            $maxPosition = Service::where('user_id', auth()->id())->max('position') ?? 0;

            $service = Service::create([
                'user_id' => auth()->id(),
                'name' => $request->validated('name'),
                'description' => $request->validated('description'),
                'color' => $request->validated('color', '#3b82f6'),
                'position' => $maxPosition + 1,
            ]);

            // Create default stages
            $defaultStages = ['To Do', 'In Progress', 'Done'];
            foreach ($defaultStages as $index => $stageName) {
                $service->stages()->create([
                    'name' => $stageName,
                    'position' => $index,
                ]);
            }

            DB::commit();

            return to_route('client.services.show', $service)
                ->with('success', 'Service created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->withInput()
                ->with('error', 'Failed to create service: '.$e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Service $service): Response
    {
        $this->authorize('view', $service);

        $service->load([
            'stages' => fn ($query) => $query->ordered()->withCount('applications'),
            'stages.applications' => fn ($query) => $query
                ->orderBy('service_position')
                ->with(['applicationType', 'status', 'assignedStaff', 'watchers']),
        ]);

        // Get user's applications that can be added to services
        $availableApplications = auth()->user()->applications()
            ->whereNull('service_id')
            ->with(['applicationType', 'status'])
            ->latest()
            ->limit(50)
            ->get();

        return Inertia::render('services/show', [
            'service' => $service,
            'availableApplications' => $availableApplications,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Service $service): Response
    {
        $this->authorize('update', $service);

        return Inertia::render('services/edit', [
            'service' => $service,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        try {
            $service->update($request->validated());

            return back()->with('success', 'Service updated successfully.');
        } catch (\Exception $e) {
            return back()
                ->withInput()
                ->with('error', 'Failed to update service: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Service $service): RedirectResponse
    {
        $this->authorize('delete', $service);

        try {
            DB::beginTransaction();

            // Remove applications from service (don't delete them)
            $service->applications()->update([
                'service_id' => null,
                'service_stage_id' => null,
                'service_position' => 0,
            ]);

            $service->delete();

            DB::commit();

            return to_route('client.services.index')
                ->with('success', 'Service deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to delete service: '.$e->getMessage());
        }
    }

    /**
     * Toggle starred status for the service.
     */
    public function toggleStar(Service $service): RedirectResponse
    {
        $this->authorize('update', $service);

        $service->update(['is_starred' => ! $service->is_starred]);

        return back()->with('success', $service->is_starred ? 'Service starred.' : 'Service unstarred.');
    }

    /**
     * Update service positions (for drag-and-drop reordering).
     */
    public function updatePositions(): RedirectResponse
    {
        $validated = request()->validate([
            'positions' => ['required', 'array'],
            'positions.*.id' => ['required', 'exists:services,id'],
            'positions.*.position' => ['required', 'integer', 'min:0'],
        ]);

        try {
            DB::beginTransaction();

            foreach ($validated['positions'] as $item) {
                Service::where('id', $item['id'])
                    ->where('user_id', auth()->id())
                    ->update(['position' => $item['position']]);
            }

            DB::commit();

            return back()->with('success', 'Service positions updated.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to update positions.');
        }
    }

    /**
     * Add an application to a service stage.
     */
    public function addApplication(Service $service): RedirectResponse
    {
        $this->authorize('addApplication', $service);

        $validated = request()->validate([
            'application_id' => ['required', 'exists:applications,id'],
            'stage_id' => ['required', 'exists:service_stages,id'],
        ]);

        try {
            $application = auth()->user()->applications()->findOrFail($validated['application_id']);
            $stage = $service->stages()->findOrFail($validated['stage_id']);

            $maxPosition = $stage->applications()->max('service_position') ?? 0;

            $application->update([
                'service_id' => $service->id,
                'service_stage_id' => $stage->id,
                'service_position' => $maxPosition + 1,
            ]);

            return back()->with('success', 'Application added to service.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to add application: '.$e->getMessage());
        }
    }

    /**
     * Remove an application from the service.
     */
    public function removeApplication(Service $service): RedirectResponse
    {
        $this->authorize('update', $service);

        $validated = request()->validate([
            'application_id' => ['required', 'exists:applications,id'],
        ]);

        try {
            $application = $service->applications()->findOrFail($validated['application_id']);

            $application->update([
                'service_id' => null,
                'service_stage_id' => null,
                'service_position' => 0,
            ]);

            return back()->with('success', 'Application removed from service.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to remove application: '.$e->getMessage());
        }
    }

    /**
     * Move an application between stages or update position.
     */
    public function moveApplication(Service $service): RedirectResponse
    {
        $this->authorize('update', $service);

        $validated = request()->validate([
            'application_id' => ['required', 'exists:applications,id'],
            'stage_id' => ['required', 'exists:service_stages,id'],
            'position' => ['required', 'integer', 'min:0'],
        ]);

        try {
            DB::beginTransaction();

            $application = $service->applications()->findOrFail($validated['application_id']);
            $newStage = $service->stages()->findOrFail($validated['stage_id']);

            // Update the application's stage and position
            $application->update([
                'service_stage_id' => $newStage->id,
                'service_position' => $validated['position'],
            ]);

            // Reorder other applications in the stage
            $newStage->applications()
                ->where('id', '!=', $application->id)
                ->where('service_position', '>=', $validated['position'])
                ->increment('service_position');

            DB::commit();

            return back()->with('success', 'Application moved successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to move application: '.$e->getMessage());
        }
    }
}
