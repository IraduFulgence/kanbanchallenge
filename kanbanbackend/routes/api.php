<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WorkspaceController;
use App\Http\Controllers\Api\BoardController;
use App\Http\Controllers\Api\ColumnController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\DashboardController;

// authentication routes for registeration, get forgot password tokens

Route::post("/auth/register",[AuthController::class,'registerUser']);
Route::post("/auth/login",[AuthController::class, 'loginUser']);

// protected routes using JWT middleware guard
Route::middleware('auth:api')->group(function(){
    Route::get('/user',[AuthController::class, 'getuserinfo']);
    Route::patch('/profile',[AuthController::class, 'updateProfile']);
    Route::post('/logout',[AuthController::class,'logUserOut']);

    // admin/project_manager account management
    Route::get('/users',[UserController::class,'index']);
    Route::post('/users',[UserController::class,'store']);
    Route::patch('/users/{user}',[UserController::class,'update']);
    Route::delete('/users/{user}',[UserController::class,'destroy']);

    // admin-only activity feed
    Route::get('/activity-logs',[ActivityLogController::class,'index']);

    // dashboard statistics + per-workspace task analytics
    Route::get('/dashboard/stats',[DashboardController::class,'stats']);
    Route::get('/working_space/{workspace}/analytics',[DashboardController::class,'taskAnalytics']);

    // route for managing working space
    Route::post('/working_space/create',[WorkspaceController::class,'store']);
    Route::get('/working_space/myspace',[WorkspaceController::class,'myspace']);
    Route::get('/working_space/{workspace}',[WorkspaceController::class,'show']);
    Route::post('/working_space/{workspace}/invite',[WorkspaceController::class,'invite']);
    Route::delete('/working_space/{workspace}/members/{user}',[WorkspaceController::class,'removeMember']);

    // boards + columns for a workspace
    Route::get('/working_space/{workspace}/boards',[BoardController::class,'index']);
    Route::post('/working_space/{workspace}/boards',[BoardController::class,'store']);
    Route::get('/boards/{board}',[BoardController::class,'show']);
    Route::delete('/boards/{board}',[BoardController::class,'destroy']);
    Route::post('/boards/{board}/columns',[ColumnController::class,'store']);
    Route::delete('/boards/{board}/columns/{column}',[ColumnController::class,'destroy']);

    // tasks living on a board column
    Route::get('/my-tasks',[TaskController::class,'myTasks']);
    Route::post('/boards/{board}/columns/{column}/tasks',[TaskController::class,'store']);
    Route::patch('/tasks/{task}',[TaskController::class,'update']);
    Route::patch('/tasks/{task}/move',[TaskController::class,'move']);
    Route::delete('/tasks/{task}',[TaskController::class,'destroy']);
});
