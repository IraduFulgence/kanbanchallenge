<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\WorkingBoard;
use App\Models\WorkingBoardColumn;
use App\Models\ActivityLog;

class ColumnController extends Controller
{
    // admin/project_manager adds one more column to an existing board
    public function store(Request $request, WorkingBoard $board)
    {
        if (auth()->user()->role == 'member') {
            return response()->json(['message'=>'unauthorized access'],401);
        }
        if (!$board->workspace->hasMember(auth()->id())) {
            return response()->json(['message'=>'unauthorized access'],401);
        }

        $data = Validator::make($request->all(),[
            'name'=>'required|string|max:100',
        ]);
        if ($data->fails()) {
            return response()->json(['message'=>$data->errors()],400);
        }

        $lastPosition = $board->columns()->max('position');
        $column = $board->columns()->create([
            'name'=>$request->get('name'),
            'position'=>$lastPosition === null ? 0 : $lastPosition + 1,
        ]);

        ActivityLog::record('column.created', $column, "{$column->name} added to board {$board->board_name}");

        return response()->json([
            'message'=>'column created',
            'data'=>$column
        ],200);
    }

    // admin/project_manager removes a column — its tasks go with it (cascade delete)
    public function destroy(WorkingBoard $board, WorkingBoardColumn $column)
    {
        if (auth()->user()->role == 'member') {
            return response()->json(['message'=>'unauthorized access'],401);
        }
        if (!$board->workspace->hasMember(auth()->id())) {
            return response()->json(['message'=>'unauthorized access'],401);
        }
        if ($column->board_id !== $board->id) {
            return response()->json(['message'=>'column does not belong to this board'],400);
        }

        ActivityLog::record('column.deleted', $column, "{$column->name} removed from board {$board->board_name}");
        $column->delete();

        return response()->json(['message'=>'column deleted'],200);
    }
}
