<?php

namespace App\Policies;

use App\Models\Application;
use App\Models\User;

class ApplicationPolicy
{
    /**
     * Determine if the user can view any applications
     */
    public function viewAny(User $user)
    {
        return $user->hasAnyRole(['admin', 'staff', 'client', 'partner']);
    }

    /**
     * Determine if the user can view the application
     */
    public function view(User $user, Application $application)
    {
        // Client can view their own
        if ($user->id === $application->user_id) {
            return true;
        }

        // Admin and staff can view all
        return $user->hasAnyRole(['admin', 'staff']);
    }

    /**
     * Determine if the user can create applications
     */
    public function create(User $user)
    {
        return $user->hasAnyRole(['client', 'partner']);
    }

    /**
     * Determine if the user can update the application
     */
    public function update(User $user, Application $application)
    {
        // Only the owner can update, and only if it's in draft status
        return $user->id === $application->user_id &&
               $application->status->slug === 'draft';
    }

    /**
     * Determine if the user can delete the application
     */
    public function delete(User $user, Application $application)
    {
        // Only the owner can delete, and only if it's in draft status
        return $user->id === $application->user_id &&
               $application->status->slug === 'draft';
    }

    /**
     * Determine if the user can approve applications
     */
    public function approve(User $user, Application $application)
    {
        return $user->hasAnyRole(['admin', 'staff']);
    }

    /**
     * Determine if the user can reject applications
     */
    public function reject(User $user, Application $application)
    {
        return $user->hasAnyRole(['admin', 'staff']);
    }

    /**
     * Determine if the user can mark applications as complete
     */
    public function complete(User $user, Application $application)
    {
        return $user->hasAnyRole(['admin', 'staff']);
    }

    /**
     * Determine if the user can assign applications
     */
    public function assign(User $user)
    {
        return $user->hasRole('admin');
    }
}
