<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use App\Models\User;
use App\Models\ActivityLog;

class UserController extends Controller
{
    // admin/project_manager registers a new account on someone else's behalf
    public function store(Request $request)
    {
        if (auth()->user()->role === 'member') {
            return response()->json(['message'=>'unauthorized access'],401);
        }

        $data = Validator::make($request->all(),[
            'name' =>'required|string|min:3|max:250',
            'email'=>'required|email|unique:users,email',
            'phone' =>'required|numeric|min:10',
            'password' => ['required',Password::min(8)
                            ->mixedCase()
                            ->numbers()
                            ->symbols(),],
            'role' => 'nullable|in:admin,project_manager,member',
        ]);
        if ($data->fails()) {
            return response()->json(['message'=>$data->errors()],400);
        }

        // a project_manager can only ever register plain members — only an
        // admin is allowed to mint other admins/project_managers
        $role = $request->get('role','member');
        if (auth()->user()->role === 'project_manager') {
            $role = 'member';
        }

        $user = User::create([
            'name' => $request->get('name'),
            'email' => $request->get('email'),
            'password' => Hash::make($request->get('password')),
            'phone' => $request->get('phone'),
            'role' => $role,
        ]);
        ActivityLog::record('user.registered', $user, "{$user->name} registered by " . auth()->user()->name);

        return response()->json([
            'message'=>'user registered successfully',
            'data'=>$user
        ],201);
    }

    // admin permanently deletes a user account
    public function destroy(User $user)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message'=>'unauthorized access'],401);
        }
        if ($user->id === auth()->id()) {
            return response()->json(['message'=>'you cannot delete your own account'],400);
        }

        ActivityLog::record('user.deleted', $user, "{$user->name} ({$user->email}) deleted by " . auth()->user()->name);
        $user->delete();

        return response()->json(null, 204);
    }
}
