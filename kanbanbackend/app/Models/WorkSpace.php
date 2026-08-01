<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkSpace extends Model
{
    //
    protected $fillable =['workspace_name'];

    public function owner(){
        return $this->belongsTo(User::class, 'owner_id');
    }
    // this working space may have many boards associated to it

    public function boards(){
        return $this->hasMany(WorkingBoard::class, 'workspace_id');
    }
    public function tasks(){
        return $this->hasManyThrough(Task::class, WorkingBoard::class, 'workspace_id', 'column_id', 'id', 'id');
    }

    // people the owner has invited into this workspace, besides the owner
    public function members(){
        return $this->hasMany(WorkspaceMembers::class, 'workspace_id');
    }

    // true if $userId owns this workspace or was invited into it
    public function hasMember($userId): bool
    {
        return $this->owner_id == $userId || $this->members()->where('user_id', $userId)->exists();
    }
}
