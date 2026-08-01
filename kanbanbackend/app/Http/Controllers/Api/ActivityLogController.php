<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ActivityLog;

class ActivityLogController extends Controller
{
    // admin-only feed of everything that's happened across the system
    public function index(Request $request)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message'=>'unauthorized access'],401);
        }

        $query = ActivityLog::with('user')->latest();

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->get('user_id'));
        }
        if ($request->filled('action')) {
            $query->where('action', $request->get('action'));
        }

        return response()->json([
            'message'=>'activity logs found',
            'data'=>$query->paginate(25)
        ],200);
    }
}
