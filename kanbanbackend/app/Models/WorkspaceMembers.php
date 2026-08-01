<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkspaceMembers extends Model
{
    //
    protected $table = 'workspace_members';
    protected $fillable = ['workspace_id', 'user_id', 'role'];

    public function workspace()
    {
        return $this->belongsTo(WorkSpace::class, 'workspace_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
