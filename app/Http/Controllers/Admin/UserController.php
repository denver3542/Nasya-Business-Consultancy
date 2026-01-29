<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    use AuthorizesRequests;

    public function __construct()
    {
        $this->authorizeResource(User::class, 'user');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $query = User::query()
            ->with(['roles', 'profile', 'partner']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Role filter
        if ($request->filled('role')) {
            $query->role($request->input('role'));
        }

        // Status filter
        if ($request->filled('status')) {
            $isActive = $request->input('status') === 'active';
            $query->where('is_active', $isActive);
        }

        // Sort
        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $users = $query->paginate(15)->withQueryString();

        $roles = Role::all(['id', 'name'])->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
            ];
        })->toArray();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'status', 'sort', 'direction']),
            'roles' => $roles,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('admin/users/create', [
            'roles' => Role::all(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        DB::beginTransaction();

        try {
            // Create user
            $userData = $request->only(['name', 'email', 'phone', 'is_active']);
            $userData['password'] = Hash::make($request->input('password'));

            // Handle profile photo upload
            if ($request->hasFile('profile_photo')) {
                $userData['profile_photo_path'] = $request->file('profile_photo')->store('profile-photos', 'public');
            }

            $user = User::create($userData);

            // Assign role
            $user->assignRole($request->input('role'));

            // Create profile if profile data exists
            if ($request->has('profile')) {
                $profileData = array_filter($request->input('profile'));
                if (! empty($profileData)) {
                    $user->profile()->create($profileData);
                }
            }

            // Create partner record if role is partner
            if ($request->input('role') === 'partner' && $request->has('partner')) {
                $partnerData = array_filter($request->input('partner'));
                if (! empty($partnerData)) {
                    $user->partner()->create($partnerData);
                }
            }

            DB::commit();

            return to_route('admin.users.index')
                ->with('success', 'User created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->withInput()
                ->with('error', 'Failed to create user: '.$e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user): Response
    {
        $this->authorize('view', $user);

        $user->load(['roles', 'profile', 'partner']);

        return Inertia::render('admin/users/show', [
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        $user->load(['roles', 'profile', 'partner']);

        return Inertia::render('admin/users/edit', [
            'user' => $user,
            'roles' => Role::all(['id', 'name']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        DB::beginTransaction();

        try {
            // Update user
            $userData = $request->only(['name', 'email', 'phone', 'is_active']);

            // Update password if provided
            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->input('password'));
            }

            // Handle profile photo upload
            if ($request->hasFile('profile_photo')) {
                // Delete old photo if exists
                if ($user->profile_photo_path) {
                    Storage::disk('public')->delete($user->profile_photo_path);
                }
                $userData['profile_photo_path'] = $request->file('profile_photo')->store('profile-photos', 'public');
            }

            $user->update($userData);

            // Update role
            if ($request->filled('role')) {
                $user->syncRoles([$request->input('role')]);
            }

            // Update or create profile
            if ($request->has('profile')) {
                $profileData = array_filter($request->input('profile'));
                if (! empty($profileData)) {
                    $user->profile()->updateOrCreate(
                        ['user_id' => $user->id],
                        $profileData
                    );
                }
            }

            // Update or create partner record if role is partner
            if ($request->input('role') === 'partner' && $request->has('partner')) {
                $partnerData = array_filter($request->input('partner'));
                if (! empty($partnerData)) {
                    $user->partner()->updateOrCreate(
                        ['user_id' => $user->id],
                        $partnerData
                    );
                }
            } elseif ($request->input('role') !== 'partner' && $user->partner) {
                // Delete partner record if role changed from partner
                $user->partner()->delete();
            }

            DB::commit();

            return to_route('admin.users.index')
                ->with('success', 'User updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to update user: '.$e->getMessage());

            return back()
                ->withInput()
                ->with('error', 'Failed to update user: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        try {
            // Delete profile photo if exists
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            $user->delete();

            return to_route('admin.users.index')
                ->with('success', 'User deleted successfully.');
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Failed to delete user: '.$e->getMessage());
        }
    }

    /**
     * Toggle user active status.
     */
    public function toggleStatus(User $user): RedirectResponse
    {
        $this->authorize('toggleStatus', $user);

        try {
            $user->update(['is_active' => ! $user->is_active]);

            $status = $user->is_active ? 'activated' : 'deactivated';

            return back()
                ->with('success', "User {$status} successfully.");
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Failed to update user status: '.$e->getMessage());
        }
    }
}
