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

    // Scopes
    public function scopeDraft($query)
    {
        return $query->whereHas('status', function ($q) {
            $q->where('slug', 'draft');
        });
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
