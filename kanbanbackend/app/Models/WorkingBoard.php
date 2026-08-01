<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkingBoard extends Model
{
    //
    protected $fillable = ['workspace_id', 'owner_id', 'board_name', 'board_details'];

    public function workspace()
    {
        return $this->belongsTo(WorkSpace::class, 'workspace_id');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function columns()
    {
        return $this->hasMany(WorkingBoardColumn::class, 'board_id')->orderBy('position');
    }

    public function tasks()
    {
        return $this->hasManyThrough(Task::class, WorkingBoardColumn::class, 'board_id', 'board_column');
    }
}
