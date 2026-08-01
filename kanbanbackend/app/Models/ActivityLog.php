<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    //
    protected $fillable = ['user_id','action','subject_type','subject_id','details','properties','ip_address'];

    protected function casts(): array
    {
        return [
            'properties' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function subject()
    {
        return $this->morphTo();
    }

    // records one activity entry — $actorId overrides auth()->id() for the one
    // call site (public self-registration) that runs before authentication
    public static function record(string $action, ?Model $subject = null, ?string $details = null, ?array $properties = null, ?int $actorId = null): self
    {
        return static::create([
            'user_id' => $actorId ?? auth()->id(),
            'action' => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject?->id,
            'details' => $details,
            'properties' => $properties,
            'ip_address' => request()->ip(),
        ]);
    }
}
