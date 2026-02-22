<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApplicationUpdateMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Application $application,
        public string $template,
        public ?string $customSubject = null,
        public ?string $customMessage = null
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->customSubject ?? $this->defaultSubject()
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.application-update',
            with: [
                'application' => $this->application,
                'headline' => $this->defaultHeadline(),
                'body' => $this->customMessage ?? $this->defaultMessage(),
            ],
        );
    }

    private function defaultSubject(): string
    {
        return match ($this->template) {
            'approved' => 'Your application has been approved',
            'rejected' => 'Your application requires attention',
            'needs_info' => 'Additional information is needed',
            'completed' => 'Your application is complete',
            default => 'Application update',
        };
    }

    private function defaultHeadline(): string
    {
        return match ($this->template) {
            'approved' => 'Application Approved',
            'rejected' => 'Application Update',
            'needs_info' => 'Information Required',
            'completed' => 'Application Completed',
            default => 'Application Update',
        };
    }

    private function defaultMessage(): string
    {
        return match ($this->template) {
            'approved' => 'Great news. Your application has been approved.',
            'rejected' => 'Your application was not approved at this time. Please review the notes and next steps.',
            'needs_info' => 'We need additional details to continue processing your application.',
            'completed' => 'Your application has been fully completed.',
            default => 'Your application has been updated.',
        };
    }
}
