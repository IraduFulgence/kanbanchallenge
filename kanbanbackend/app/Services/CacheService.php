<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class CacheService
{
    /**
     * Cache duration in seconds
     */
    private const TTL_SHORT = 60; // 1 minute
    private const TTL_MEDIUM = 300; // 5 minutes
    private const TTL_LONG = 3600; // 1 hour
    private const TTL_DAY = 86400; // 24 hours

    /**
     * Cache keys prefixes
     */
    private const PREFIX_WORKSPACE = 'workspace:';
    private const PREFIX_BOARD = 'board:';
    private const PREFIX_TASK = 'task:';
    private const PREFIX_STATS = 'stats:';
    private const PREFIX_ACTIVITY = 'activity:';
    private const PREFIX_USER = 'user:';
    private const PREFIX_USER_WORKSPACES = 'user_workspaces:';

    /**
     * Get cached data or store it
     */
    public function remember(string $key, int $ttl, callable $callback)
    {
        return Cache::remember($key, $ttl, $callback);
    }

    /**
     * Get cached data or store it forever
     */
    public function rememberForever(string $key, callable $callback)
    {
        return Cache::rememberForever($key, $callback);
    }

    /**
     * Get cached data
     */
    public function get(string $key)
    {
        return Cache::get($key);
    }

    /**
     * Store data in cache
     */
    public function put(string $key, $value, int $ttl = self::TTL_MEDIUM): bool
    {
        return Cache::put($key, $value, $ttl);
    }

    /**
     * Store data in cache forever
     */
    public function forever(string $key, $value): bool
    {
        return Cache::forever($key, $value);
    }

    /**
     * Remove cached data
     */
    public function forget(string $key): bool
    {
        return Cache::forget($key);
    }

    /**
     * Remove all cached data with a specific prefix
     */
    public function forgetByPrefix(string $prefix): void
    {
        $keys = Redis::keys($prefix . '*');
        if (!empty($keys)) {
            Redis::del($keys);
        }
    }

    /**
     * Flush entire cache
     */
    public function flush(): bool
    {
        return Cache::flush();
    }

    /**
     * Get workspace cache key
     */
    public function workspaceKey(int $workspaceId): string
    {
        return self::PREFIX_WORKSPACE . $workspaceId;
    }

    /**
     * Get board cache key
     */
    public function boardKey(int $boardId): string
    {
        return self::PREFIX_BOARD . $boardId;
    }

    /**
     * Get task cache key
     */
    public function taskKey(int $taskId): string
    {
        return self::PREFIX_TASK . $taskId;
    }

    /**
     * Get stats cache key
     */
    public function statsKey(int $workspaceId): string
    {
        return self::PREFIX_STATS . $workspaceId;
    }

    /**
     * Get activity cache key
     */
    public function activityKey(int $workspaceId, int $page = 1): string
    {
        return self::PREFIX_ACTIVITY . $workspaceId . ':page:' . $page;
    }

    /**
     * Get user cache key
     */
    public function userKey(int $userId): string
    {
        return self::PREFIX_USER . $userId;
    }

    /**
     * Get user workspaces cache key
     */
    public function userWorkspacesKey(int $userId): string
    {
        return self::PREFIX_USER_WORKSPACES . $userId;
    }

    /**
     * Clear all workspace related cache
     */
    public function clearWorkspaceCache(int $workspaceId): void
    {
        $this->forget($this->workspaceKey($workspaceId));
        $this->forget($this->statsKey($workspaceId));
        $this->forgetByPrefix($this->activityKey($workspaceId));
        
        // Clear all board caches for this workspace
        $boards = \App\Models\Board::where('workspace_id', $workspaceId)->pluck('id');
        foreach ($boards as $boardId) {
            $this->forget($this->boardKey($boardId));
        }
    }

    /**
     * Clear all task related cache
     */
    public function clearTaskCache(int $taskId): void
    {
        $this->forget($this->taskKey($taskId));
        
        // Clear board cache as tasks are part of board
        $task = \App\Models\Task::find($taskId);
        if ($task && $task->column && $task->column->board) {
            $this->forget($this->boardKey($task->column->board->id));
        }
    }

    /**
     * Clear user cache
     */
    public function clearUserCache(int $userId): void
    {
        $this->forget($this->userKey($userId));
        $this->forget($this->userWorkspacesKey($userId));
    }

    /**
     * Get cache TTLs
     */
    public function getTtl(string $type = 'medium'): int
    {
        return match($type) {
            'short' => self::TTL_SHORT,
            'long' => self::TTL_LONG,
            'day' => self::TTL_DAY,
            default => self::TTL_MEDIUM,
        };
    }
}