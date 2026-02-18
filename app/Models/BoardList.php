<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BoardList extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_id',
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
     * Get the board that owns the list.
     */
    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    /**
     * Get the applications in this list.
     */
    public function applications(): HasMany
    {
        return $this->hasMany(Application::class)->orderBy('board_position');
    }

    /**
     * Scope to order lists by position.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<BoardList>  $query
     * @return \Illuminate\Database\Eloquent\Builder<BoardList>
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('position');
    }

    /**
     * Get the count of applications in this list.
     */
    public function getApplicationsCountAttribute(): int
    {
        return $this->applications()->count();
    }
}
