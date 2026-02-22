<?php

namespace App\Notifications;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApplicationWatcherChangedNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected Application $application,
        protected string $action
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $actionLabel = $this->action === 'added' ? 'added as watcher' : 'removed from watchers';

        return (new MailMessage)
            ->subject("Application {$this->application->application_number} watcher update")
            ->line("You were {$actionLabel} on an application.")
            ->line("Application #: {$this->application->application_number}")
            ->line("Current status: {$this->application->status->name}");
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'application_id' => $this->application->id,
            'action' => $this->action,
        ];
    }
}
