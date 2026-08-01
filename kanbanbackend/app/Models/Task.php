<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    //
    protected $fillable = [
        'board_column',
        'board_id',
        'task_title',
        'task_details',
        'position',
        'task_duedate',
        'priority',
        'task_status',
        'created_by',
        'assigned_to',
    ];

    public function board()
    {
        return $this->belongsTo(WorkingBoard::class, 'board_id');
    }

    public function column()
    {
        return $this->belongsTo(WorkingBoardColumn::class, 'board_column');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function comments()
    {
        return $this->hasMany(TaskComment::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }
}
