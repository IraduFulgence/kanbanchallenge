# Automated Controller→Cache Key Map & Snippets

This document is auto-generated from `app/Http/Controllers/Api/` and provides a recommended cache key for each public endpoint, suggested TTL, and copy/paste-ready snippets for controller caching and model observer invalidation.

CONVENTION USED
- `PREFIX` = `config('cache.prefix')` (set in `.env` as `CACHE_PREFIX`)
- Key pattern: `{{PREFIX}}:resource:scope:identifier` (colon-separated)
- Store: `Cache::store('redis')` or `Cache` (if `CACHE_STORE=redis`)

---

## Map (controller → endpoint → key)

WorkspaceController
- `myspace()`
  - Key: `PREFIX:workspace:myspace:{userId}`
  - TTL: 60s
- `show(WorkSpace $workspace)`
  - Key: `PREFIX:workspace:show:{workspaceId}`
  - TTL: 60–300s

BoardController
- `index(WorkSpace $workspace)`
  - Key: `PREFIX:boards:workspace:{workspaceId}`
  - TTL: 30–120s
- `show(WorkingBoard $board)`
  - Key: `PREFIX:board:show:{boardId}`
  - TTL: 30–120s

ColumnController
- `store(...)` / `destroy(...)` (mutations)
  - List key for board columns: `PREFIX:board:{boardId}:columns`
  - TTL: 30–120s

TaskController
- `myTasks(Request $request)`
  - Key: `PREFIX:tasks:user:{userId}:page:{n}`
  - TTL: 30–60s
- `index per board/column` (if implemented)
  - Key: `PREFIX:board:{boardId}:tasks:page:{n}` or `PREFIX:column:{columnId}:tasks:page:{n}`
  - TTL: 10–60s
- `show(Task $task)`
  - Key: `PREFIX:task:show:{taskId}`
  - TTL: 60–300s

DashboardController
- `stats()`
  - Key: `PREFIX:dashboard:user:{userId}`
  - TTL: 15–60s
- `taskAnalytics(WorkSpace $workspace)`
  - Key: `PREFIX:dashboard:workspace:{workspaceId}:analytics`
  - TTL: 30–120s

ActivityLogController
- `index()`
  - Key: `PREFIX:activity:workspace:{workspaceId}:page:{n}` or `PREFIX:activity:user:{userId}`
  - TTL: 15–60s

UserController
- `index()`
  - Key: `PREFIX:users:list:role:{role}:page:{n}`
  - TTL: 60–300s (admin-only)

HealthCheck
- `check()`
  - Do NOT cache health checks globally; they should run live.

---

## Controller caching snippet (recommended pattern)

Place caching in controller/service layer where the data is assembled (prefer service classes when available):

```php
use Illuminate\Support\Facades\Cache;

$prefix = config('cache.prefix');
$key = sprintf('%s:workspace:myspace:%d', $prefix, $userId);
$data = Cache::store('redis')->remember($key, 60, function () use ($userId) {
    return WorkSpace::where('owner_id', $userId)
        ->orWhereHas('members', fn($q) => $q->where('user_id', $userId))
        ->withCount('boards')
        ->get()
        ->toArray(); // store arrays to avoid serializing Eloquent models
});

return response()->json(['data' => $data]);
```

Notes:
- Use `->toArray()` or `->makeHidden()` to avoid serializing large objects.
- Prefer `Cache::store('redis')` for explicitness.

---

## Observer invalidation snippets (recommended centralization)

Create observers under `app/Observers/` and register them in `AppServiceProvider` or `EventServiceProvider`.

### WorkSpaceObserver (example)
```php
use Illuminate\Support\Facades\Cache;

class WorkSpaceObserver
{
    public function created(WorkSpace $workspace)
    {
        // clear the owner's myspace list
        $prefix = config('cache.prefix');
        Cache::store('redis')->forget(sprintf('%s:workspace:myspace:%d', $prefix, $workspace->owner_id));

        // flush workspace-tagged caches if you use tags
        if (Cache::supportsTags()) {
            Cache::tags(['workspace:'.$workspace->id])->flush();
        }
    }

    public function updated(WorkSpace $workspace)
    {
        $prefix = config('cache.prefix');
        Cache::store('redis')->forget(sprintf('%s:workspace:show:%d', $prefix, $workspace->id));
        Cache::store('redis')->forget(sprintf('%s:workspace:myspace:%d', $prefix, $workspace->owner_id));
        if (Cache::supportsTags()) { Cache::tags(['workspace:'.$workspace->id])->flush(); }
    }

    public function deleted(WorkSpace $workspace)
    {
        $prefix = config('cache.prefix');
        Cache::store('redis')->forget(sprintf('%s:workspace:show:%d', $prefix, $workspace->id));
        Cache::store('redis')->forget(sprintf('%s:workspace:myspace:%d', $prefix, $workspace->owner_id));
        if (Cache::supportsTags()) { Cache::tags(['workspace:'.$workspace->id])->flush(); }
    }
}
```

### BoardObserver (example)
```php
class BoardObserver
{
    public function created(WorkingBoard $board)
    {
        $prefix = config('cache.prefix');
        Cache::store('redis')->forget(sprintf('%s:boards:workspace:%d', $prefix, $board->workspace_id));
        if (Cache::supportsTags()) { Cache::tags(['workspace:'.$board->workspace_id])->flush(); }
    }

    public function updated(WorkingBoard $board)
    {
        $prefix = config('cache.prefix');
        Cache::store('redis')->forget(sprintf('%s:board:show:%d', $prefix, $board->id));
    }

    public function deleted(WorkingBoard $board)
    {
        $prefix = config('cache.prefix');
        Cache::store('redis')->forget(sprintf('%s:boards:workspace:%d', $prefix, $board->workspace_id));
        Cache::store('redis')->forget(sprintf('%s:board:show:%d', $prefix, $board->id));
        if (Cache::supportsTags()) { Cache::tags(['workspace:'.$board->workspace_id])->flush(); }
    }
}
```

### TaskObserver (example)
```php
class TaskObserver
{
    public function created(Task $task)
    {
        $prefix = config('cache.prefix');
        Cache::store('redis')->forget(sprintf('%s:board:%d:tasks:*', $prefix, $task->board_id));
        Cache::store('redis')->forget(sprintf('%s:task:show:%d', $prefix, $task->id));
        Cache::store('redis')->forget(sprintf('%s:dashboard:user:%d', $prefix, $task->assigned_to ?? $task->created_by));
        if (Cache::supportsTags()) { Cache::tags(['board:'.$task->board_id, 'workspace:'.$task->board->workspace_id])->flush(); }
    }

    public function updated(Task $task)
    {
        $prefix = config('cache.prefix');
        Cache::store('redis')->forget(sprintf('%s:task:show:%d', $prefix, $task->id));
        Cache::store('redis')->forget(sprintf('%s:board:%d:tasks:*', $prefix, $task->board_id));
    }

    public function deleted(Task $task)
    {
        $prefix = config('cache.prefix');
        Cache::store('redis')->forget(sprintf('%s:board:%d:tasks:*', $prefix, $task->board_id));
        Cache::store('redis')->forget(sprintf('%s:task:show:%d', $prefix, $task->id));
    }
}
```

Notes about the `*` wildcard in `forget` above: Redis does not support wildcards in `DEL` via Laravel's simple `forget`. Use tags or maintain explicit keys for pagination variants. When wildcards are needed, consider storing paginated page keys in an index key (e.g., `PREFIX:board:{id}:tasks:index`) that you can iterate and `forget` each key.

---

## How to register observers
- Create observer classes under `app/Observers/`.
- Register them in `App\Providers\AppServiceProvider::boot()`:
```php
WorkSpace::observe(WorkSpaceObserver::class);
WorkingBoard::observe(BoardObserver::class);
Task::observe(TaskObserver::class);
```

---

## Testing & verification snippets
- Controller caching test (Tinker):
```php
use Illuminate\Support\Facades\Cache;
$id = 1;
$key = sprintf('%s:workspace:myspace:%d', config('cache.prefix'), $id);
Cache::store('redis')->forget($key);
Cache::store('redis')->remember($key, 60, fn()=>['ok']);
Cache::store('redis')->get($key); // should return ['ok']
```

- Redis inspection:
```bash
redis-cli -n 1 keys "*myworkingspace*"
redis-cli -n 1 ttl "${PREFIX}:workspace:myspace_1"
```

---

If you want, I can now:
- Generate ready-to-paste observer class files in `app/Observers/` (I will not modify existing code unless you confirm).
- Generate controller snippet patches (as separate files) for quick copy-paste into controllers.

Which next? (Create observer files | Create controller snippet files | Both | Nothing)