<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicationView extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'type',
        'filters',
        'sort',
        'group_by',
        'visible_fields',
        'is_default',
        'is_shared',
        'position',
    ];

    protected $casts = [
        'filters' => 'array',
        'sort' => 'array',
        'group_by' => 'array',
        'visible_fields' => 'array',
        'is_default' => 'boolean',
        'is_shared' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeShared($query)
    {
        return $query->where('is_shared', true);
    }
}