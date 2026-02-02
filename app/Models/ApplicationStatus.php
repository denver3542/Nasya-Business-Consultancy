<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicationStatus extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'color',
        'icon',
        'is_final',
        'visible_to_client',
        'display_order',
    ];

    protected $casts = [
        'is_final' => 'boolean',
        'visible_to_client' => 'boolean',
    ];

    // Relationships
    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    // Scopes
    public function scopeVisibleToClient($query)
    {
        return $query->where('visible_to_client', true)->orderBy('display_order');
    }

    // Helper methods
    public function getBadgeClassAttribute()
    {
        return "bg-{$this->color}-100 text-{$this->color}-800";
    }
}
