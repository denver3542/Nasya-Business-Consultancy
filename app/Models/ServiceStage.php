<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceStage extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id',
        'name',
        'color',
        'position',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
        ];
    }

    /**
     * Get the service that owns the stage.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Get the applications in this stage.
     */
    public function applications(): HasMany
    {
        return $this->hasMany(Application::class)->orderBy('service_position');
    }

    /**
     * Scope to order stages by position.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<ServiceStage>  $query
     * @return \Illuminate\Database\Eloquent\Builder<ServiceStage>
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('position');
    }

    /**
     * Get the count of applications in this stage.
     */
    public function getApplicationsCountAttribute(): int
    {
        return $this->applications()->count();
    }
}
