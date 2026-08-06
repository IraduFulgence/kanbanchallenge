# Caching Guide — kanbanchallenge (Backend)

This guidance explains where to apply caching in the Laravel backend, how to implement it safely and effectively using Redis (your configured cache store), and recommended patterns for invalidation, TTLs, and testing. No code changes are made here — this is a reference for implementation.

**Goals**
- Reduce expensive database queries and repeated computations.
- Improve API response latency for read-heavy endpoints (lists, dashboards, counts).
- Keep cache correctness via targeted invalidation rather than long-lived blind caching.

**High-level strategy**
- Cache read-heavy results (collections, list endpoints, computed counts) with short-to-medium TTLs.
- Use cache keys with clear naming and include user/tenant ids when data is user-specific.
- Invalidate or update cache on write operations (create/update/delete) using model observers, events, or synchronous `Cache::forget` calls.
- Use Redis-specific features where helpful (cache tags for grouped invalidation, but note tags require Redis driver and supported client).

**Where to apply caching (priority order)**
- Controller endpoints that return lists or aggregated data:
  - `WorkspaceController::myspace()` — caches workspace list per user (already present). Key: `myworkingspace_{userId}`.
  - Board listing endpoints (`BoardController@index`) — cache lists/per-user or per-workspace.
  - Task lists for columns or boards (`TaskController@index`) — cache per-board or per-column if large.
  - Dashboard summary endpoints (counts, recent activity) — cache computed aggregates.
- Model-heavy queries:
  - Any Eloquent queries with multiple joins, heavy `with()` relationships, or `withCount()` that run on every request.
- Expensive computed values:
  - Reports, ranked lists, or derived fields that require multiple queries.
- Enumerations/lookup values:
  - Static lists (column types, colors, labels) — cache long (or forever) and invalidate on change.

**Key naming conventions**
- Use a consistent prefix and separators, e.g. `{app-prefix}:{cache-type}:{scope}:{id}`. Examples:
  - `kanban:workspace:myspace:1` (user 1 workspaces)
  - `kanban:workspace:boards:workspace_5`
  - `kanban:board:tasks:board_10:page_1`
- Include versioning when changing response shape: `...:v1`.
- Keep keys short but deterministic.

**TTL recommendations**
- Short (10–60 seconds): very dynamic lists, near-real-time UIs.
- Medium (1–5 minutes): typical list endpoints where small staleness is acceptable.
- Long (30 minutes–forever): static lookups or computed reports that are expensive to build and only change infrequently.
- Use `remember()` with explicit seconds or `rememberForever()` for static data combined with explicit invalidation.

**Invalidation patterns**
- Immediate `Cache::forget($key)` on create/update/delete for matching keys.
- Use model observers or event listeners:
  - On `WorkSpace`, `Board`, `Task` created/updated/deleted → forget related keys (user workspace list, board tasks, counts).
- Use cache tags (recommended for grouped invalidation):
  - Tag per workspace: `Cache::tags(['workspace:'.$id])->put($key, $value, $ttl);` then `Cache::tags(['workspace:'.$id])->flush()` on major updates.
  - Note: confirm `redis` store and client support tags in your environment.
- When partial data changes (e.g., a single task updated), prefer updating only affected keys instead of flushing whole tag groups.

**Where to call invalidation in this repo**
- Controllers after mutating actions (quick but less central): e.g., after `BoardController@store` call `Cache::forget()` for board lists.
- Observers (recommended centralized approach): e.g., `TaskObserver`, `BoardObserver`, `WorkSpaceObserver` — call `Cache::forget()` or `Cache::tags(...)->flush()` there.
- Jobs/background workers: for heavy recalculations, queue a job to rebuild cache asynchronously and warm keys.

**Cache tagging vs explicit keys**
- Tags are convenient for group invalidation (e.g., everything for workspace `42`). Use tags if your Redis client supports them.
- If tags are not available, maintain a list of related keys or follow a deterministic key naming scheme to `forget` them.

**Eager loading & serialization considerations**
- When caching Eloquent collections, eager load relationships (`with()`) before caching to avoid N+1 issues at read time.
- Be mindful of serialized object versions — prefer caching arrays (`->toArray()`) or simple data structures when long-lived.
- Ensure `config('cache.serializable_classes')` and `APP_KEY` settings are compatible with any stored objects.

**Concurrency and race conditions**
- Use `Cache::remember()` to avoid duplicate recomputation.
- For very expensive computations, consider a locking mechanism (`Cache::lock()`) to ensure only one worker populates the cache.

**Testing & verification**
- Unit tests: stub `Cache` facade and assert `Cache::remember`/`Cache::forget` are called appropriately.
- Integration tests: call endpoints and assert keys appear in Redis DB 1 (`redis-cli -n 1 keys "*myworkingspace*"`).
- Manual checks: after calling mutation endpoints, confirm related keys are removed or updated.

**Monitoring & metrics**
- Log cache hits/misses for critical endpoints (small counters stored in Redis or a metrics system).
- Track average response times before/after caching for the highest-traffic endpoints.

**Security & privacy**
- Never cache sensitive user tokens, passwords, or PII in cached blobs unless encrypted and appropriate.
- Ensure keys include user scoping when data is per-user.

**Implementation checklist (per endpoint)**
- [ ] Identify whether endpoint is read-heavy or compute-heavy.
- [ ] Decide cache scope (per-user, per-workspace, global).
- [ ] Choose key naming and TTL.
- [ ] Implement `Cache::remember($key, $ttl, $closure)` in controller or service layer.
- [ ] Add invalidation in model observers or controller mutation code.
- [ ] Add tests asserting caching behavior.
- [ ] Add monitoring for hit/miss rates.

**Example application points in this repo (no code changes here)**
- `app/Http/Controllers/Api/WorkspaceController.php` — `myspace()` already uses `Cache::remember` (good spot). Confirm invalidation on workspace create/update/delete.
- `app/Observers/TaskObserver.php` — add cache invalidation when tasks change (e.g., forget board task lists, workspace summaries).
- `app/Models/WorkSpace.php` / `WorkingBoard.php` — consider model events to flush workspace-wide caches.

**Operational notes**
- Ensure `.env` sets `CACHE_STORE=redis` and app config is cleared after changes: `php artisan config:clear` and `php artisan cache:clear`.
- Remember cache DB: the app uses Redis DB `1` for cache by default — use `redis-cli -n 1` for inspection.
- Set a meaningful `CACHE_PREFIX` in `.env` to avoid collisions when sharing Redis.

**Quick troubleshooting**
- Cache writes return `true` from `Cache::put` and `Cache::get` returns stored value — Redis connectivity OK.
- If keys don't appear with `redis-cli` check DB index (`config('database.redis.cache.database')`) and prefix (`config('cache.prefix')`).

---

If you want, I can also:
- Generate a per-endpoint checklist file listing exact keys and invalidation points for each controller in the repo.
- Draft sample code snippets for `Cache::remember`, `Cache::tags`, and observer invalidation (still in guidance, no repo changes).


