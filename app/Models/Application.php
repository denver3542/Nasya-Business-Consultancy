<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Application extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'application_number',
        'user_id',
        'application_type_id',
        'application_status_id',
        'assigned_to',
        'form_data',
        'total_fee',
        'amount_paid',
        'is_paid',
        'client_notes',
        'staff_notes',
        'rejection_reason',
        'completion_percentage',
        'submitted_at',
        'approved_at',
        'rejected_at',
        'completed_at',
        'deadline',

        // ClickUp features
        'priority',
        'tags',
        'custom_fields',
        'view_preference',
        'position',
        'is_starred',
        'is_archived',
        'due_date',
        'start_date',
        'time_estimate',
        'time_tracked',

        // Board features
        'board_id',
        'board_list_id',
        'board_position',
    ];

    protected $casts = [
        'form_data' => 'array',
        'total_fee' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'is_paid' => 'boolean',
        'completion_percentage' => 'integer',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'completed_at' => 'datetime',
        'deadline' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function applicationType()
    {
        return $this->belongsTo(ApplicationType::class);
    }

    public function status()
    {
        return $this->belongsTo(ApplicationStatus::class, 'application_status_id');
    }

    public function assignedStaff()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function documents()
    {
        return $this->hasMany(ApplicationDocument::class);
    }

    public function timeline()
    {
        return $this->hasMany(ApplicationTimeline::class)->orderBy('created_at', 'desc');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // New ClickUp-style relationships
    public function comments()
    {
        return $this->hasMany(ApplicationComment::class)->whereNull('parent_id')->latest();
    }

    public function allComments()
    {
        return $this->hasMany(ApplicationComment::class)->latest();
    }

    public function watchers()
    {
        return $this->belongsToMany(User::class, 'application_watchers');
    }

    /**
     * Get the board this application belongs to.
     */
    public function board()
    {
        return $this->belongsTo(Board::class);
    }

    /**
     * Get the board list this application belongs to.
     */
    public function boardList()
    {
        return $this->belongsTo(BoardList::class);
    }

    // Scopes

    public function scopeStarred($query)
    {
        return $query->where('is_starred', true);
    }

    public function scopeArchived($query)
    {
        return $query->where('is_archived', true);
    }

    public function scopeActive($query)
    {
        return $query->where('is_archived', false);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeDraft($query)
    {
        return $query->whereHas('status', function ($q) {
            $q->where('slug', 'draft');
        });
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
            ->whereNotIn('application_status_id', function ($q) {
                $q->select('id')
                    ->from('application_statuses')
                    ->whereIn('slug', ['completed', 'cancelled', 'rejected']);
            });
    }

    public function scopeDueToday($query)
    {
        return $query->whereDate('due_date', today());
    }

    public function scopeDueThisWeek($query)
    {
        return $query->whereBetween('due_date', [now()->startOfWeek(), now()->endOfWeek()]);
    }

    public function scopeSubmitted($query)
    {
        return $query->whereHas('status', function ($q) {
            $q->where('slug', 'submitted');
        });
    }

    public function scopePending($query)
    {
        return $query->whereHas('status', function ($q) {
            $q->whereIn('slug', ['submitted', 'under-review', 'processing']);
        });
    }

    public function scopeApproved($query)
    {
        return $query->whereHas('status', function ($q) {
            $q->where('slug', 'approved');
        });
    }

    public function scopeCompleted($query)
    {
        return $query->whereHas('status', function ($q) {
            $q->where('slug', 'completed');
        });
    }

    // Accessors
    // Accessors
    public function getPriorityLabelAttribute()
    {
        $labels = [
            0 => 'None',
            1 => 'Low',
            2 => 'Medium',
            3 => 'High',
            4 => 'Urgent',
        ];

        return $labels[$this->priority] ?? 'None';
    }

    public function getPriorityColorAttribute()
    {
        $colors = [
            0 => 'gray',
            1 => 'blue',
            2 => 'yellow',
            3 => 'orange',
            4 => 'red',
        ];

        return $colors[$this->priority] ?? 'gray';
    }

    public function getIsOverdueAttribute()
    {
        if (! $this->due_date) {
            return false;
        }

        return $this->due_date->isPast() &&
               ! in_array($this->status->slug, ['completed', 'cancelled', 'rejected']);
    }

    public function getDaysUntilDueAttribute()
    {
        if (! $this->due_date) {
            return null;
        }

        return now()->diffInDays($this->due_date, false);
    }

    public function getTimeEstimateFormattedAttribute()
    {
        if (! $this->time_estimate) {
            return null;
        }

        if ($this->time_estimate < 1) {
            return ($this->time_estimate * 60).' min';
        }

        return $this->time_estimate.' hr'.($this->time_estimate > 1 ? 's' : '');
    }

    public function getTimeTrackedFormattedAttribute()
    {
        $minutes = $this->time_tracked;

        if ($minutes < 60) {
            return $minutes.' min';
        }

        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;

        if ($remainingMinutes === 0) {
            return $hours.' hr'.($hours > 1 ? 's' : '');
        }

        return $hours.'h '.$remainingMinutes.'m';
    }

    public function getStatusColorAttribute()
    {
        return $this->status->color ?? 'gray';
    }

    public function getStatusBadgeAttribute()
    {
        return $this->status->getBadgeClassAttribute();
    }

    public function getIsDraftAttribute()
    {
        return $this->status->slug === 'draft';
    }

    public function getIsSubmittedAttribute()
    {
        return ! is_null($this->submitted_at);
    }

    public function getCanEditAttribute()
    {
        return $this->status->slug === 'draft';
    }

    public function getCanSubmitAttribute()
    {
        return $this->status->slug === 'draft' &&
               $this->completion_percentage >= 100;
    }

    public function getRemainingBalanceAttribute()
    {
        return $this->total_fee - $this->amount_paid;
    }

    public function getFormattedTotalFeeAttribute()
    {
        return '₱'.number_format($this->total_fee, 2);
    }

    public function getFormattedAmountPaidAttribute()
    {
        return '₱'.number_format($this->amount_paid, 2);
    }

    public function getFormattedRemainingBalanceAttribute()
    {
        return '₱'.number_format($this->remaining_balance, 2);
    }

    // Helper Methods
    public function toggleStar()
    {
        $this->update(['is_starred' => ! $this->is_starred]);

        return $this->is_starred;
    }

    public function archive()
    {
        $this->update(['is_archived' => true]);
    }

    public function unarchive()
    {
        $this->update(['is_archived' => false]);
    }

    public function addWatcher(User $user)
    {
        if (! $this->watchers->contains($user->id)) {
            $this->watchers()->attach($user->id);
        }
    }

    public function removeWatcher(User $user)
    {
        $this->watchers()->detach($user->id);
    }

    public function isWatchedBy(User $user)
    {
        return $this->watchers->contains($user->id);
    }

    public function addComment($comment, User $user, $parentId = null)
    {
        return $this->comments()->create([
            'user_id' => $user->id,
            'comment' => $comment,
            'parent_id' => $parentId,
        ]);
    }

    public function updateCompletionPercentage()
    {
        $requiredFields = $this->applicationType->form_fields ?? [];
        $formData = $this->form_data ?? [];

        if (empty($requiredFields)) {
            $this->completion_percentage = 100;
            $this->save();

            return;
        }

        $totalFields = count($requiredFields);
        $completedFields = 0;

        foreach ($requiredFields as $field) {
            $fieldName = $field['name'] ?? null;
            $isRequired = $field['required'] ?? false;

            if ($isRequired && isset($formData[$fieldName]) && ! empty($formData[$fieldName])) {
                $completedFields++;
            } elseif (! $isRequired) {
                $completedFields++;
            }
        }

        $this->completion_percentage = ($completedFields / $totalFields) * 100;
        $this->save();
    }

    public function addToTimeline($action, $description, $metadata = null)
    {
        return $this->timeline()->create([
            'user_id' => auth()->id(),
            'action' => $action,
            'description' => $description,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }

    // Boot method for auto-generating application number
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($application) {
            if (empty($application->application_number)) {
                $application->application_number = static::generateApplicationNumber();
            }

            static::created(function ($application) {
                $application->addWatcher($application->user);
            });
        });
    }

    public static function generateApplicationNumber()
    {
        $prefix = 'NASYA';
        $year = date('Y');
        $month = date('m');

        // Get the last application number for this month
        $lastApplication = static::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastApplication ? (intval(substr($lastApplication->application_number, -4)) + 1) : 1;

        return sprintf('%s-%s%s-%04d', $prefix, $year, $month, $sequence);
    }
}
