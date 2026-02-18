<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Board extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'color',
        'is_starred',
        'position',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_starred' => 'boolean',
            'position' => 'integer',
        ];
    }

    /**
     * Get the user that owns the board.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the lists for the board.
     */
    public function lists(): HasMany
    {
        return $this->hasMany(BoardList::class)->orderBy('position');
    }

    /**
     * Get the applications on this board.
     */
    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    /**
     * Scope to filter boards by starred status.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<Board>  $query
     * @return \Illuminate\Database\Eloquent\Builder<Board>
     */
    public function scopeStarred($query)
    {
        return $query->where('is_starred', true);
    }

    /**
     * Scope to order boards by position.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<Board>  $query
     * @return \Illuminate\Database\Eloquent\Builder<Board>
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('position');
    }
}
