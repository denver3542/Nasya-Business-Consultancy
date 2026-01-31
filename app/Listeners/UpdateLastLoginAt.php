<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class UpdateLastLoginAt
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(Login $event): void
    {
        // Works for default User model + guards
        $user = $event->user;

        // Avoid touching timestamps if you want ONLY last_login_at updated
        $user->forceFill([
            'last_login_at' => now(),
        ])->save();
    }
}