<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkingBoardColumn extends Model
{
    //
    protected $fillable = ['board_id', 'name', 'position'];

    public function board()
    {
        return $this->belongsTo(WorkingBoard::class, 'board_id');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'board_column')->orderBy('position');
    }
}
