<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApplicationType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'base_fee',
        'required_documents',
        'form_fields',
        'requirements',
        'estimated_processing_days',
        'icon',
        'color',
        'is_active',
        'display_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'required_documents' => 'array',
            'form_fields' => 'array',
            'requirements' => 'array',
            'base_fee' => 'decimal:2',
            'is_active' => 'boolean',
            'estimated_processing_days' => 'integer',
        ];
    }

    /**
     * Get the applications for this type.
     */
    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    /**
     * Get the form fields for this application type.
     */
    public function formFields(): BelongsToMany
    {
        return $this->belongsToMany(FormField::class, 'application_type_form_field')
            ->withPivot(['is_required', 'display_order', 'section'])
            ->withTimestamps()
            ->orderByPivot('display_order');
    }

    /**
     * Get all form fields formatted for frontend (merges new structure with legacy JSON).
     *
     * @return array<int, array<string, mixed>>
     */
    public function getFormFieldsArrayAttribute(): array
    {
        // First, try to get fields from the new relational structure
        $relationalFields = $this->formFields()
            ->with('options')
            ->get()
            ->map(function (FormField $field) {
                return [
                    'id' => $field->id,
                    'name' => $field->name,
                    'label' => $field->label,
                    'type' => $field->type,
                    'required' => (bool) $field->pivot->is_required,
                    'placeholder' => $field->placeholder,
                    'help_text' => $field->help_text,
                    'validation' => $field->validation_rules,
                    'section' => $field->pivot->section,
                    'options' => $field->options->map(fn ($opt) => [
                        'label' => $opt->label,
                        'value' => $opt->value,
                    ])->toArray(),
                ];
            })
            ->toArray();

        // If relational fields exist, use them
        if (count($relationalFields) > 0) {
            return $relationalFields;
        }

        // Fall back to legacy JSON form_fields if no relational fields
        return $this->form_fields ?? [];
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('display_order');
    }

    // Accessors
    public function getFormattedFeeAttribute()
    {
        return '₱'.number_format($this->base_fee, 2);
    }

    public function getEstimatedDurationAttribute()
    {
        if (! $this->estimated_processing_days) {
            return 'Varies';
        }

        $days = $this->estimated_processing_days;

        if ($days < 7) {
            return $days.' day'.($days > 1 ? 's' : '');
        } elseif ($days < 30) {
            $weeks = ceil($days / 7);

            return $weeks.' week'.($weeks > 1 ? 's' : '');
        } else {
            $months = ceil($days / 30);

            return $months.' month'.($months > 1 ? 's' : '');
        }
    }
}
