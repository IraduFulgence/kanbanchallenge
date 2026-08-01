<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use App\Models\WorkSpace;
use App\Models\WorkingBoard;
use App\Models\Task;
use App\Models\User;

class DashboardController extends Controller
{
    // high-level overview across every workspace the current user owns or belongs to
    public function stats()
    {
        $userId = auth()->id();

        $workspaceIds = WorkSpace::where('owner_id', $userId)
            ->orWhereHas('members', fn ($query) => $query->where('user_id', $userId))
            ->pluck('id');

        $boardIds = WorkingBoard::whereIn('workspace_id', $workspaceIds)->pluck('id');
        $tasksQuery = Task::whereIn('board_id', $boardIds);

        return response()->json(['data' => [
            'workspaces_count' => $workspaceIds->count(),
            'boards_count' => $boardIds->count(),
            'tasks_count' => (clone $tasksQuery)->count(),
            'overdue_tasks_count' => (clone $tasksQuery)
                ->whereNotNull('task_duedate')
                ->where('task_duedate', '<', now())
                ->whereNotIn('task_status', ['Done', 'Cancelled'])
                ->count(),
            'my_assigned_tasks_count' => Task::where('assigned_to', $userId)->count(),
        ]], 200);
    }

    // per-workspace task breakdown — any member of the workspace can view it
    public function taskAnalytics(WorkSpace $workspace)
    {
        if (!$workspace->hasMember(auth()->id())) {
            return response()->json(['message'=>'unauthorized access'],401);
        }

        $boardIds = $workspace->boards()->pluck('id');
        $tasksQuery = Task::whereIn('board_id', $boardIds);

        $statusBreakdown = (clone $tasksQuery)
            ->select('task_status', DB::raw('count(*) as count'))
            ->groupBy('task_status')
            ->pluck('count', 'task_status');

        $priorityBreakdown = (clone $tasksQuery)
            ->select('priority', DB::raw('count(*) as count'))
            ->groupBy('priority')
            ->pluck('count', 'priority');

        $overdueCount = (clone $tasksQuery)
            ->whereNotNull('task_duedate')
            ->where('task_duedate', '<', now())
            ->whereNotIn('task_status', ['Done', 'Cancelled'])
            ->count();

        $workloadRows = (clone $tasksQuery)
            ->whereNotNull('assigned_to')
            ->select('assigned_to', DB::raw('count(*) as count'))
            ->groupBy('assigned_to')
            ->get();

        $assignees = User::whereIn('id', $workloadRows->pluck('assigned_to'))
            ->get(['id', 'name', 'email'])
            ->keyBy('id');

        $workload = $workloadRows->map(fn ($row) => [
            'user' => $assignees->get($row->assigned_to),
            'count' => $row->count,
        ])->values();

        return response()->json(['data' => [
            'total_tasks' => (clone $tasksQuery)->count(),
            'status_breakdown' => $statusBreakdown,
            'priority_breakdown' => $priorityBreakdown,
            'overdue_tasks_count' => $overdueCount,
            'workload_by_assignee' => $workload,
        ]], 200);
    }
}
