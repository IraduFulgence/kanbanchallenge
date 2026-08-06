# Per-endpoint Cache Keys & Invalidation Map

This file lists recommended cache key names, TTLs, and invalidation spots for the API controllers in `app/Http/Controllers/Api/`.

Format:
- Endpoint (Controller@method)
  - Purpose: short
  - Key pattern: example
  - TTL: recommended
  - Invalidate when: where to call `Cache::forget` or `Cache::tags()->flush()`
  - Notes: tags or alternative suggestions

---

## WorkspaceController
- `WorkspaceController@myspace`
  - Purpose: user-specific list of workspaces
  - Key pattern: `{prefix}:workspace:myspace:{userId}`  (example `kanban:workspace:myspace:1`)
  - TTL: 60–300s (1–5 minutes)
  - Invalidate when: `WorkSpace` created/updated/deleted; user invited/removed from workspace
  - Where to invalidate: `WorkSpace` observer (created/updated/deleted) and `WorkspaceMembers` create/delete actions (invite/removeMember)
  - Notes: use tags `workspace:{id}` for workspace-scoped caches and `user:{id}` for user-scoped caches

- `WorkspaceController@show`
  - Purpose: single workspace detail view (owner, boards, members)
  - Key pattern: `{prefix}:workspace:show:{workspaceId}`
  - TTL: 60–300s
  - Invalidate when: workspace updated, membership change, board added/removed
  - Invalidate points: `WorkSpace` observer, `WorkspaceMembers` changes, `Board` create/delete

## BoardController
- `BoardController@index` (if exists)
  - Purpose: list boards in a workspace
  - Key pattern: `{prefix}:boards:workspace:{workspaceId}:page:{n}`
  - TTL: 30–120s
  - Invalidate when: Board created/updated/deleted; column reorder
  - Invalidate points: `Board` observer, column/board mutations
  - Notes: use tags `workspace:{id}` to flush all boards on major workspace changes

- `BoardController@show`
  - Purpose: board detail with columns and counts
  - Key pattern: `{prefix}:board:show:{boardId}`
  - TTL: 30–120s
  - Invalidate when: board update, column/task changes
  - Invalidate points: `Board`, `WorkingBoardColumn`, `Task` observers

## ColumnController
- `ColumnController@index` / `ColumnController@show`
  - Purpose: column lists for a board
  - Key pattern: `{prefix}:board:{boardId}:columns`
  - TTL: 30–120s
  - Invalidate when: column created/updated/deleted, column order change
  - Invalidate points: `WorkingBoardColumn` observer

## TaskController
- `TaskController@index` (tasks per board or column)
  - Purpose: tasks listing (per-board or per-column)
  - Key pattern: `{prefix}:board:{boardId}:tasks:page:{n}` or `{prefix}:column:{columnId}:tasks:page:{n}`
  - TTL: 10–60s (if active board) or 60–300s (if less active)
  - Invalidate when: task created/updated/deleted, task move between columns
  - Invalidate points: `TaskObserver` (created/updated/deleted/moved) — forget affected board/column keys and counts
  - Notes: consider updating counts separately (cache `board:{id}:counts`)

- `TaskController@show`
  - Purpose: single task detail
  - Key pattern: `{prefix}:task:show:{taskId}`
  - TTL: 60–300s
  - Invalidate when: task updated or comments changed
  - Invalidate points: `TaskObserver`, `TaskComment` created/deleted

## DashboardController
- `DashboardController@index` (aggregates and counts)
  - Purpose: user dashboard summary (counts, recent activity)
  - Key pattern: `{prefix}:dashboard:user:{userId}`
  - TTL: 15–60s
  - Invalidate when: tasks/boards/workspaces change for that user
  - Invalidate points: `Task`, `Board`, `WorkSpace` observers (update user-specific dashboard keys)
  - Notes: use separate keys for heavy reports, rebuild asynchronously if expensive

## ActivityLogController
- `ActivityLogController@index`
  - Purpose: recent activity list for workspace or user
  - Key pattern: `{prefix}:activity:workspace:{workspaceId}:page:{n}` or `{prefix}:activity:user:{userId}`
  - TTL: 15–60s
  - Invalidate when: activity created (append or re-cache)
  - Invalidate points: activity creation should update or prepend to cache; no full flush required

## UserController / AuthController
- Generally avoid caching any responses that expose authentication-sensitive data.
- Use caching for public non-sensitive user lookups (e.g., user display name list) with long TTL and careful scoping.

## HealthCheck
- Do not cache health endpoints.

---

# Invalidation implementation recommendations
- Prefer centralizing invalidation in model observers under `app/Observers/`:
  - `WorkSpaceObserver` → forget `workspace:show:{id}`, `workspace:myspace:{ownerId}` and flush workspace tags
  - `BoardObserver` → forget `boards:workspace:{id}` and `board:show:{id}`
  - `TaskObserver` → forget `board:{boardId}:tasks:*`, `column:{columnId}:tasks:*`, `task:show:{taskId}`, and update counts `board:{id}:counts`
  - `WorkspaceMembers` events → forget `workspace:myspace:{userId}` for affected users

- For grouped invalidation, use `Cache::tags(['workspace:'.$workspaceId])` when writing list/board/task caches. On major workspace changes call `Cache::tags(['workspace:'.$workspaceId])->flush()`.

# Testing checklist (automatic map)
- For each endpoint listed above:
  - Call the endpoint (as the proper user) and assert the appropriate cache key appears in Redis DB 1.
  - Perform the write operation that should invalidate and assert the key was removed or updated.

---

If you want, I can now:
- Produce an automated mapping file that inspects controllers and methods to list endpoints (best-effort) and generates the key patterns into this document.
- Or generate ready-to-copy code snippets for observers and controller cache usage for each endpoint.

Which do you prefer? (Auto-map controllers | Generate snippets for observers | Both)