<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\WorkSpace;
use App\Models\WorkingBoard;
use App\Models\ActivityLog;

class BoardController extends Controller
{
    // list every board that belongs to a workspace the user can see
    public function index(WorkSpace $workspace)
    {
        if (!$workspace->hasMember(auth()->id())) {
            return response()->json(['message'=>'unauthorized access'],401);
        }

        return response()->json([
            'message'=>'boards found',
            'data'=>$workspace->boards()->withCount('columns')->get()
        ],200);
    }

    // admin/project_manager creates a board with its columns in one go
    public function store(Request $request, WorkSpace $workspace)
    {
        // simple member can't create a board
        if (auth()->user()->role == 'member') {
            return response()->json(['message'=>'unauthorized access'],401);
        }
        if (!$workspace->hasMember(auth()->id())) {
            return response()->json(['message'=>'unauthorized access'],401);
        }

        $data = Validator::make($request->all(),[
            'board_name'=>'required|min:3|max:225',
            'board_details'=>'nullable|string|max:1000',
            'columns'=>'required|array|min:1',
            'columns.*'=>'required|string|max:100',
        ]);
        if ($data->fails()) {
            return response()->json(['message'=>$data->errors()],400);
        }

        $board = $workspace->boards()->create([
            'owner_id'=>auth()->id(),
            'board_name'=>$request->get('board_name'),
            'board_details'=>$request->get('board_details'),
        ]);

        foreach ($request->get('columns') as $position => $name) {
            $board->columns()->create([
                'name'=>$name,
                'position'=>$position,
            ]);
        }

        ActivityLog::record('board.created', $board, "{$board->board_name} created in {$workspace->workspace_name}");

        return response()->json([
            'message'=>'board created',
            'data'=>$board->load('columns')
        ],200);
    }

    // full board with its columns and the tasks sitting in each column
    public function show(WorkingBoard $board)
    {
        if (!$board->workspace->hasMember(auth()->id())) {
            return response()->json(['message'=>'unauthorized access'],401);
        }

        return response()->json([
            'message'=>'board found',
            'data'=>$board->load(['owner','columns.tasks.creator','columns.tasks.assignee'])
        ],200);
    }

    // admin/project_manager deletes a board — its columns and tasks cascade with it
    public function destroy(WorkingBoard $board)
    {
        if (auth()->user()->role == 'member') {
            return response()->json(['message'=>'unauthorized access'],401);
        }
        if (!$board->workspace->hasMember(auth()->id())) {
            return response()->json(['message'=>'unauthorized access'],401);
        }

        ActivityLog::record('board.deleted', $board, "{$board->board_name} deleted");
        $board->delete();

        return response()->json(['message'=>'board deleted'],200);
    }
}
