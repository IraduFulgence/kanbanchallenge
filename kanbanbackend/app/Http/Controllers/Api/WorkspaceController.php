<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\WorkSpace;
use App\Models\WorkspaceMembers;
use App\Models\User;
use App\Models\ActivityLog;

class WorkspaceController extends Controller
{
    //create workspace that belongs to user
    public function store(Request $request){
    // simple member can't create working space
    if (auth()->user()->role == 'member') {
        # code...
        return response()->json(['message'=>'unauthorized access'],401);
    }
    $data = Validator::make($request->all(),[
        'workspace_name'=>'required|min:3|max:225'
    ]);
    if ($data->fails()) {
        # code...
        return response()->json(['message'=>$data->errors()],400);
    }
    // register workspace
    $workspace = auth()->user()->workspaces()->create(['workspace_name'=>$request->get('workspace_name')]);
    ActivityLog::record('workspace.created', $workspace, "{$workspace->workspace_name} created");
     return response()->json([
        'message'=>'workspace created',
        'data'=>$workspace
     ],200);
    }
    // getting all the working spaces the current user owns or was invited into
    public function myspace(){
        // check if the user is logged in

        if (!auth()->user()) {
            # code...
            return response()->json(['message'=>"You must login"],401);
        }
        $myworkingspace = WorkSpace::where('owner_id',auth()->user()->id)
            ->orWhereHas('members', function($query){
                $query->where('user_id', auth()->id());
            })
            ->withCount('boards')
            ->get();

        if ($myworkingspace->isNotEmpty()) {
            # code...
            return response()->json([
                'message'=>'Working space found',
                'data'=>$myworkingspace
            ],200);
        }
        return response()->json(['message'=>'No working space found'],201);

    }

 public function show(WorkSpace $workspace)
    {
       // only the owner or an invited member can see the workspace
       if (!$workspace->hasMember(auth()->id())) {
           return response()->json(['message'=>'unauthorized access'],401);
       }
       return response()->json([
            'message'=>'Working space found',
            'data'=>$workspace->load(['owner','boards','members.user'])
       ],200);
    }

    // owner, admin (any workspace) or project_manager (workspaces they belong to)
    // can manage who's a member of a workspace
    private function canManageMembers(WorkSpace $workspace): bool
    {
        $user = auth()->user();
        if ($workspace->owner_id === $user->id) {
            return true;
        }
        if ($user->role === 'admin') {
            return true;
        }
        if ($user->role === 'project_manager') {
            return $workspace->hasMember($user->id);
        }
        return false;
    }

    // admin/project_manager owning or belonging to the workspace can invite someone else in by email
    public function invite(Request $request, WorkSpace $workspace)
    {
        if (!$this->canManageMembers($workspace)) {
            return response()->json(['message'=>'unauthorized access'],401);
        }

        $data = Validator::make($request->all(),[
            'email'=>'required|email|exists:users,email',
        ]);
        if ($data->fails()) {
            return response()->json(['message'=>$data->errors()],400);
        }

        $invitee = User::where('email', $request->get('email'))->first();

        if ($invitee->id === $workspace->owner_id) {
            return response()->json(['message'=>'this user already owns the workspace'],400);
        }
        if ($workspace->members()->where('user_id', $invitee->id)->exists()) {
            return response()->json(['message'=>'this user is already a member of the workspace'],400);
        }

        WorkspaceMembers::create([
            'workspace_id'=>$workspace->id,
            'user_id'=>$invitee->id,
            'role'=>'member',
        ]);
        ActivityLog::record('workspace.member_invited', $workspace, "{$invitee->name} invited to {$workspace->workspace_name}");

        return response()->json([
            'message'=>'member invited successfully',
            'data'=>$workspace->load('members.user')
        ],200);
    }

    // admin (any workspace) or project_manager (workspaces they belong to) revokes
    // a member's access — this only removes them from the workspace, it does not
    // touch the user's account
    public function removeMember(WorkSpace $workspace, User $user)
    {
        if (!$this->canManageMembers($workspace)) {
            return response()->json(['message'=>'unauthorized access'],401);
        }
        if ($user->id === $workspace->owner_id) {
            return response()->json(['message'=>'cannot remove the workspace owner'],400);
        }

        $membership = $workspace->members()->where('user_id', $user->id)->first();
        if (!$membership) {
            return response()->json(['message'=>'this user is not a member of the workspace'],400);
        }
        ActivityLog::record('workspace.member_removed', $workspace, "{$user->name} removed from {$workspace->workspace_name}");
        $membership->delete();

        return response()->json([
            'message'=>'member access removed',
            'data'=>$workspace->load('members.user')
        ],200);
    }

public function update(UpdateWorkspaceRequest $request, Workspace $workspace)
{
    $this->authorize('update', $workspace);
    $workspace->update($request->validated());
    return $workspace;
}

public function destroy(Workspace $workspace)
{
    $this->authorize('delete', $workspace);
    $workspace->delete();
    return response()->json(null, 204);
}
}
