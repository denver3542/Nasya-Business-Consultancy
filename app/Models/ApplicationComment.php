<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicationComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'user_id',
        'comment',
        'attachments',
        'parent_id',
    ];

    protected $casts = [
        'attachments' => 'array',
    ];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(ApplicationComment::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(ApplicationComment::class, 'parent_id')->latest();
    }
}