# Kanban Challenge

A clean, full-stack Kanban project built as a monorepo.

## What it is
- **Backend**: `kanbanbackend/` — Laravel 13 REST API, JWT auth, MySQL persistence
- **Frontend**: `kanbanfrontend/` — Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- **Workflow**: workspaces → boards → columns → tasks, with drag-and-drop task management and role-based access control.

## Why it matters
- Role-aware collaboration for `admin`, `project_manager`, and `member`
- Per-workspace analytics and dashboard summaries
- System-wide activity logging for audit and reporting
- Task assignment and overdue tracking across multiple workspaces

## Key features
- JWT auth and profile management
- Workspace creation and member invitations
- Board setup with custom columns
- Task creation, editing, movement, and deletion
- “My Tasks” task feed for assigned tasks
- Dashboard counts, overdue tasks, and work breakdowns
- Admin activity log and user management

## Getting started

### Prerequisites
- PHP 8.3+ with Laravel extensions (`pdo_mysql`, `mbstring`, etc.)
- Composer
- MySQL or compatible database
- Node.js 20+ and npm

### Run the backend
```bash
cd kanbanbackend
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate
php artisan serve
```

### Run the frontend
```bash
cd kanbanfrontend
npm install
cp .env.example .env.local
npm run dev
```

## Configuration

### Backend (`kanbanbackend/.env`)
- `APP_URL`: API base URL
- `DB_*`: database connection settings
- `JWT_SECRET`: JWT signing key
- `JWT_TTL`: token lifetime in minutes

### Frontend (`kanbanfrontend/.env.local`)
- `NEXT_PUBLIC_API_URL`: backend API URL, including `/api`

## Project structure

- `kanbanbackend/`
  - `app/Http/Controllers/Api/`: API controllers
  - `app/Models/`: Eloquent models
  - `database/migrations/`: database schema
  - `routes/api.php`: API routes
- `kanbanfrontend/`
  - `app/`: pages and client components
  - `components/`: reusable UI components
  - `hooks/`: auth and state hooks
  - `lib/`: API client and types

## API overview

All protected routes use `Authorization: Bearer <token>`.

| Area | Sample endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /user`, `PATCH /profile`, `POST /logout` |
| Users | `GET /users`, `POST /users`, `PATCH /users/{user}`, `DELETE /users/{user}` |
| Workspaces | `POST /working_space/create`, `GET /working_space/myspace`, `GET /working_space/{workspace}`, `POST /working_space/{workspace}/invite`, `DELETE /working_space/{workspace}/members/{user}` |
| Boards | `GET /working_space/{workspace}/boards`, `GET /boards/{board}`, `POST /working_space/{workspace}/boards`, `DELETE /boards/{board}` |
| Columns | `POST /boards/{board}/columns`, `DELETE /boards/{board}/columns/{column}` |
| Tasks | `GET /my-tasks`, `POST /boards/{board}/columns/{column}/tasks`, `PATCH /tasks/{task}`, `PATCH /tasks/{task}/move`, `DELETE /tasks/{task}` |
| Dashboard | `GET /dashboard/stats`, `GET /working_space/{workspace}/analytics` |
| Activity log | `GET /activity-logs` (admin only) |

## Useful commands

**Backend**
```bash
php artisan serve
php artisan migrate:fresh
php artisan test
php artisan scribe:generate
```

**Frontend**
```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Notes
- Backend and frontend run independently.
- The frontend consumes the backend over HTTP only.
- JWT authentication secures protected API routes.
- The app is designed for workspace-based teamwork and admin reporting.

## Test credentials
Use these when available for quick access:
- API: `https://kanbanapi.bellatis.com/api`
- Frontend: `https://kanban.bellatis.com`
- Email: `member@kanban.test`
- Password: `Myhandle12@`
