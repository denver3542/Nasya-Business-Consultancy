<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class ApplicationTypeFormField extends Pivot
{
    protected $table = 'application_type_form_field';

    public $incrementing = true;

    protected $fillable = [
        'application_type_id',
        'form_field_id',
        'is_required',
        'display_order',
        'section',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    /**
     * Get the application type.
     */
    public function applicationType(): BelongsTo
    {
        return $this->belongsTo(ApplicationType::class);
    }

    /**
     * Get the form field.
     */
    public function formField(): BelongsTo
    {
        return $this->belongsTo(FormField::class);
    }
}
