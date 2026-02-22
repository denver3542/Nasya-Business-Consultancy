<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasAnyRole(['admin', 'staff']), 403);

        $query = User::query()
            ->role('client')
            ->with('profile')
            ->withCount('applications');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('registered_from')) {
            $query->whereDate('created_at', '>=', $request->string('registered_from')->toString());
        }

        if ($request->filled('registered_to')) {
            $query->whereDate('created_at', '<=', $request->string('registered_to')->toString());
        }

        $clients = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('clients/index', [
            'clients' => $clients,
            'filters' => $request->only(['search', 'registered_from', 'registered_to']),
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()->hasAnyRole(['admin', 'staff']), 403);

        return Inertia::render('clients/create');
    }

    public function store(StoreClientRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $client = User::create([
                'name' => $request->string('name')->toString(),
                'email' => $request->string('email')->toString(),
                'password' => Hash::make($request->string('password')->toString()),
                'phone' => $request->input('phone'),
                'is_active' => $request->boolean('is_active', true),
            ]);

            $client->assignRole('client');

            $profileData = array_filter((array) $request->input('profile', []), fn ($value) => $value !== null && $value !== '');
            if ($profileData !== []) {
                $client->profile()->create($profileData);
            }
        });

        return to_route('clients.index')->with('success', 'Client created successfully.');
    }

    public function show(Request $request, User $client): Response
    {
        abort_unless($request->user()->hasAnyRole(['admin', 'staff']), 403);
        abort_unless($client->hasRole('client'), 404);

        $client->load([
            'profile',
            'applications.applicationType',
            'applications.status',
        ]);
        $client->loadCount('applications');

        return Inertia::render('clients/show', [
            'client' => $client,
        ]);
    }

    public function edit(Request $request, User $client): Response
    {
        abort_unless($request->user()->hasAnyRole(['admin', 'staff']), 403);
        abort_unless($client->hasRole('client'), 404);

        $client->load('profile');

        return Inertia::render('clients/edit', [
            'client' => $client,
        ]);
    }

    public function update(UpdateClientRequest $request, User $client): RedirectResponse
    {
        abort_unless($client->hasRole('client'), 404);

        DB::transaction(function () use ($request, $client): void {
            $payload = [
                'name' => $request->string('name')->toString(),
                'email' => $request->string('email')->toString(),
                'phone' => $request->input('phone'),
                'is_active' => $request->boolean('is_active', true),
            ];

            if ($request->filled('password')) {
                $payload['password'] = Hash::make($request->string('password')->toString());
            }

            $client->update($payload);

            $profileData = (array) $request->input('profile', []);
            if ($profileData !== []) {
                $client->profile()->updateOrCreate(['user_id' => $client->id], $profileData);
            }
        });

        return to_route('clients.show', $client)->with('success', 'Client updated successfully.');
    }

    public function destroy(Request $request, User $client): RedirectResponse
    {
        abort_unless($request->user()->hasAnyRole(['admin', 'staff']), 403);
        abort_unless($client->hasRole('client'), 404);

        $client->delete();

        return to_route('clients.index')->with('success', 'Client deleted successfully.');
    }
}
