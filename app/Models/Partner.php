<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Partner extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'company_name',
        'company_type',
        'license_number',
        'commission_rate',
        'is_verified',
        'notes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
            'is_verified' => 'boolean',
        ];
    }

    /**
     * Get the user that owns the partner record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
