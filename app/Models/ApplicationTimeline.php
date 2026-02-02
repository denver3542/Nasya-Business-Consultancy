<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicationTimeline extends Model
{
    use HasFactory;

    public $timestamps = false; // We only use created_at

    protected $table = 'application_timeline';

    protected $fillable = [
        'application_id',
        'user_id',
        'action',
        'description',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    // Relationships
    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Accessors
    public function getIconAttribute()
    {
        $icons = [
            'created' => 'fa-plus-circle',
            'updated' => 'fa-edit',
            'submitted' => 'fa-paper-plane',
            'approved' => 'fa-check-circle',
            'rejected' => 'fa-times-circle',
            'document_uploaded' => 'fa-file-upload',
            'document_verified' => 'fa-file-check',
            'payment_received' => 'fa-credit-card',
            'status_changed' => 'fa-exchange-alt',
            'assigned' => 'fa-user-tag',
            'completed' => 'fa-flag-checkered',
        ];

        return $icons[$this->action] ?? 'fa-circle';
    }

    public function getColorAttribute()
    {
        $colors = [
            'created' => 'blue',
            'updated' => 'gray',
            'submitted' => 'blue',
            'approved' => 'green',
            'rejected' => 'red',
            'document_uploaded' => 'indigo',
            'document_verified' => 'green',
            'payment_received' => 'green',
            'status_changed' => 'yellow',
            'assigned' => 'purple',
            'completed' => 'green',
        ];

        return $colors[$this->action] ?? 'gray';
    }
}
