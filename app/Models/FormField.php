<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormField extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'label',
        'type',
        'placeholder',
        'help_text',
        'validation_rules',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'validation_rules' => 'array',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the options for this field (for select, radio, checkbox types).
     */
    public function options(): HasMany
    {
        return $this->hasMany(FormFieldOption::class)->orderBy('display_order');
    }

    /**
     * Get the application types that use this field.
     */
    public function applicationTypes(): BelongsToMany
    {
        return $this->belongsToMany(ApplicationType::class, 'application_type_form_field')
            ->withPivot(['is_required', 'display_order', 'section'])
            ->withTimestamps();
    }

    /**
     * Scope for active fields only.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<FormField>  $query
     * @return \Illuminate\Database\Eloquent\Builder<FormField>
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Check if this field type requires options.
     */
    public function requiresOptions(): bool
    {
        return in_array($this->type, ['select', 'radio', 'checkbox']);
    }
}
