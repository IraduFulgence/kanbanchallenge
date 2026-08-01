<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Task;
use App\Models\WorkingBoard;
use App\Models\WorkingBoardColumn;
use App\Models\ActivityLog;

class TaskController extends Controller
{
    // any workspace member (admin, project_manager or member) can drop a task on a column
    public function store(Request $request, WorkingBoard $board, WorkingBoardColumn $column)
    {
        if (!$board->workspace->hasMember(auth()->id())) {
            return response()->json(['message'=>'unauthorized access'],401);
        }
        if ($column->board_id !== $board->id) {
            return response()->json(['message'=>'column does not belong to this board'],400);
        }

        $data = Validator::make($request->all(),[
            'task_title'=>'required|string|max:225',
            'task_details'=>'required|string',
            'priority'=>'nullable|in:low,medium,high,critical',
            'task_duedate'=>'nullable|date',
            'assigned_to'=>'nullable|exists:users,id',
        ]);
        if ($data->fails()) {
            return response()->json(['message'=>$data->errors()],400);
        }

        $lastPosition = $column->tasks()->max('position');
        $task = Task::create([
            'board_column'=>$column->id,
            'board_id'=>$board->id,
            'task_title'=>$request->get('task_title'),
            'task_details'=>$request->get('task_details'),
            'position'=>$lastPosition === null ? 0 : $lastPosition + 1,
            'task_duedate'=>$request->get('task_duedate'),
            'priority'=>$request->get('priority','low'),
            'created_by'=>auth()->id(),
            'assigned_to'=>$request->get('assigned_to'),
        ]);
        ActivityLog::record('task.created', $task, "{$task->task_title} created");

        return response()->json([
            'message'=>'task created',
            'data'=>$task->load(['creator','assignee'])
        ],200);
    }

    // "update" button on a task card — edit its details
    public function update(Request $request, Task $task)
    {
        if (!$task->board->workspace->hasMember(auth()->id())) {
            return response()->json(['message'=>'unauthorized access'],401);
        }

        $data = Validator::make($request->all(),[
            'task_title'=>'sometimes|required|string|max:225',
            'task_details'=>'sometimes|required|string',
            'priority'=>'sometimes|in:low,medium,high,critical',
            'task_status'=>'sometimes|in:Todo,Inprogress,Inreview,Done,Cancelled,Onhold',
            'task_duedate'=>'nullable|date',
            'assigned_to'=>'nullable|exists:users,id',
        ]);
        if ($data->fails()) {
            return response()->json(['message'=>$data->errors()],400);
        }

        $task->update($data->validated());
        ActivityLog::record('task.updated', $task, "{$task->task_title} updated", $data->validated());

        return response()->json([
            'message'=>'task updated',
            'data'=>$task->load(['creator','assignee'])
        ],200);
    }

    // dragging a task from one column to another (or just reordering it)
    public function move(Request $request, Task $task)
    {
        if (!$task->board->workspace->hasMember(auth()->id())) {
            return response()->json(['message'=>'unauthorized access'],401);
        }

        $data = Validator::make($request->all(),[
            'board_column'=>'required|exists:working_board_columns,id',
            'position'=>'nullable|integer|min:0',
        ]);
        if ($data->fails()) {
            return response()->json(['message'=>$data->errors()],400);
        }

        $column = WorkingBoardColumn::find($request->get('board_column'));
        if ($column->board_id !== $task->board_id) {
            return response()->json(['message'=>'column does not belong to this board'],400);
        }

        $position = $request->get('position');
        if ($position === null) {
            $lastPosition = $column->tasks()->max('position');
            $position = $lastPosition === null ? 0 : $lastPosition + 1;
        }

        $task->update([
            'board_column'=>$column->id,
            'position'=>$position,
        ]);
        ActivityLog::record('task.moved', $task, "{$task->task_title} moved to column {$column->name}");

        return response()->json([
            'message'=>'task moved',
            'data'=>$task->load(['creator','assignee'])
        ],200);
    }

    // remove a task from the board entirely — members may only delete tasks they created
    public function destroy(Task $task)
    {
        if (!$task->board->workspace->hasMember(auth()->id())) {
            return response()->json(['message'=>'unauthorized access'],401);
        }
        if (auth()->user()->role === 'member' && $task->created_by !== auth()->id()) {
            return response()->json(['message'=>'you can only delete tasks you created'],401);
        }

        ActivityLog::record('task.deleted', $task, "{$task->task_title} deleted");
        $task->delete();

        return response()->json(['message'=>'task deleted'],200);
    }
}
