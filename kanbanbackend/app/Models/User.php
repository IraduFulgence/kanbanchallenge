<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

#[Fillable(['name', 'email', 'password','phone','user_avatar','role','is_online','last_seen'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    public function getAuthPassword()
    {
        return $this->password;
    }
    // relationships
    // user may have many workspaces 
    public function workspaces(){
        return $this->hasMany(WorkSpace::class,'owner_id');
    }
    // user may get more tasks
    public function assignedTasks()
    {
        return $this->hasMany(Task::class,'assigned_to');
    }

    // user can get or post many comments
    
    public function comments(){
        return $this->hasMany(TaskComment::class);
    }
    // user can log many activities

    public function activityLogs(){
        return $this->hasMany(ActivityLog::class);
    }
}
