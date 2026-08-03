# Kanban Challenge

A full-stack, role-based Kanban project management tool. Teams organize work into **workspaces → boards → columns → tasks**, with drag-and-drop task management, per-workspace analytics, a system-wide activity log, and role-scoped access control (Admin / Project Manager / Member).

The project is a monorepo with two independent applications:

| App | Stack | Role |
|---|---|---|
| [`kanbanbackend/`](kanbanbackend) | Laravel 13, PHP 8.3+, JWT auth | REST API + persistence |
| [`kanbanfrontend/`](kanbanfrontend) | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 
They communicate purely over HTTP — the frontend calls the backend's `/api/*` routes with a bearer JWT. There is no server-side rendering that depends on the API; every dashboard route is a client component.

---

## Features

**Authentication & accounts**
- Register / login backed by JWT (`tymon/jwt-auth`), with automatic logout and redirect on token expiry
- Self-service profile page — update name/email/phone, change password (current password required)
- Role-based access control: `admin`, `project_manager`, `member`

**Workspaces, boards & tasks**
- Create workspaces and invite members by email
- Boards with custom columns; tasks carry a title, description, priority (`low`/`medium`/`high`/`critical`), status (`Todo`/`Inprogress`/`Inreview`/`Done`/`Onhold`/`Cancelled`), due date, and assignee
- Drag-and-drop task board with optimistic UI updates
- **My Tasks** — every task assigned to the logged-in user, aggregated across all of their workspaces, with inline status updates and overdue highlighting

**Dashboards & reporting**
- Home dashboard with workspace/board/task counts and overdue/assigned-to-me tiles
- Per-workspace analytics: status breakdown, priority breakdown, workload by assignee
- Admin-only system-wide **activity log** (every create/update/delete/invite action, who did it, and when), surfaced both as a "Recent activity" widget on the admin home page and a full paginated log under Reports

**Team management**
- Admin/Project Manager can browse the employee directory, create accounts, and (admin-only) edit roles or delete accounts
- Admin/Project Manager can add existing users to a workspace

---

## Tech stack

**Backend** — `kanbanbackend/`
- Laravel 13 (PHP ^8.3)
- MySQL (via Eloquent) — see [`.env.example`](kanbanbackend/.env.example) for supported drivers
- `tymon/jwt-auth` for stateless JWT authentication
- `knuckleswtf/scribe` for auto-generated API documentation

**Frontend** — `kanbanfrontend/`
- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- Plain `fetch`-based API client (`lib/api.ts`) — no external data-fetching library

## Getting started

### Prerequisites

- PHP 8.3+ with the extensions Laravel needs (`pdo_mysql`, `mbstring`, etc.)
- Composer
- MySQL (or another Laravel-supported DB — update `DB_*` in `.env` accordingly)
- Node.js 20+ and npm

### 1. Backend (`kanbanbackend/`)

```bash
cd kanbanbackend
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret          # populates JWT_SECRET in .env

# point DB_* in .env at your database, then:
php artisan migrate

php artisan serve               # http://127.0.0.1:8000
```

The API is served under `https://kanban.bellatis.com/api`.

> **First account**: public self-registration (`POST /api/auth/register`) always creates a `member`. To get an admin account for local testing, register normally, then promote it:
> ```bash
> php artisan tinker --execute="App\Models\User::where('email','you@example.com')->update(['role'=>'admin']);"
> ```

### 2. Frontend (`kanbanfrontend/`)

```bash
cd kanbanfrontend
npm install
cp .env.example .env.local       # set NEXT_PUBLIC_API_URL if it differs from the default

npm run dev                      # http://localhost:3000
```

Open `https://lkanban,bellatis.com` — you'll be redirected to `/auth/login`.

### Environment variables

**Backend** (`kanbanbackend/.env`)

| Key | Purpose |
|---|---|
| `APP_URL` | Base URL the API is served from |
| `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Database connection |
| `JWT_SECRET` | Signing key for issued JWTs — generate with `php artisan jwt:secret` |
| `JWT_TTL` | Access token lifetime, in minutes (default `60`) |

**Frontend** (`kanbanfrontend/.env.local`)

| Key | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the Laravel API, including the `/api` suffix (e.g. `https://kanbanapi.bellatis.com/api`) |

---

## Project structure

```
kanbanchallenge/
├── kanbanbackend/                     # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/Api/      # AuthController, UserController, WorkspaceController,
│   │   │                              #   BoardController, ColumnController, TaskController,
│   │   │                              #   ActivityLogController, DashboardController
│   │   ├── Models/                    # User, WorkSpace, WorkingBoard, WorkingBoardColumn,
│   │   │                              #   Task, ActivityLog, ...
│   │   └── Policies/
│   ├── database/migrations/
│   └── routes/api.php
│
└── kanbanfrontend/                    # Next.js app
    ├── app/
    │   ├── auth/{login,register}/     # public auth pages
    │   └── dashboard/
    │       ├── home/                  # stats + admin activity feed
    │       ├── tasks/                 # "My Tasks"
    │       ├── projects/              # workspaces → boards → tasks
    │       ├── team/                  # employee directory
    │       ├── reports/               # admin activity log
    │       └── profile/               # self-service account settings
    ├── components/
    ├── hooks/useAuth.tsx               # auth context (login/register/logout/profile updates)
    └── lib/{api.ts,types.ts}           # typed API client
```

---

## API overview

All protected routes require `Authorization: Bearer <token>` and live under `auth:api` middleware. Run `php artisan scribe:generate` in `kanbanbackend/` for full request/response docs.

| Group | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /user`, `PATCH /profile`, `POST /logout` |
| Users (admin/PM) | `GET/POST /users`, `PATCH /users/{user}`, `DELETE /users/{user}` |
| Workspaces | `POST /working_space/create`, `GET /working_space/myspace`, `GET /working_space/{workspace}`, `POST /working_space/{workspace}/invite`, `DELETE /working_space/{workspace}/members/{user}` |
| Boards & columns | `GET/POST /working_space/{workspace}/boards`, `GET/DELETE /boards/{board}`, `POST /boards/{board}/columns`, `DELETE /boards/{board}/columns/{column}` |
| Tasks | `GET /my-tasks`, `POST /boards/{board}/columns/{column}/tasks`, `PATCH /tasks/{task}`, `PATCH /tasks/{task}/move`, `DELETE /tasks/{task}` |
| Dashboard & reporting | `GET /dashboard/stats`, `GET /working_space/{workspace}/analytics`, `GET /activity-logs` (admin only) |

---

## Roadmap / known gaps

- The **Departments** sidebar entry (admin nav) has no corresponding page yet.
- `TaskComment`, `TaskLabel` and `BoardLabel` tables/models exist in the schema but aren't yet exposed through the API or UI.

---

## Scripts reference

**Backend**
```bash
php artisan serve            # dev server
php artisan migrate:fresh    # rebuild schema (drops existing data)
php artisan test             # PHPUnit
php artisan scribe:generate  # regenerate API docs
```

**Frontend**
```bash
npm run dev      # dev server with hot reload
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
```
** For testing run**
```
https:kanbanapi.bellatis.com/api #for end points
https:kanban.bellatis.com        #for frontend
email: member@kanban.test
password: Myhandle12@
```