# Redis setup guide for this project (Debian 13)

This guide is for learning and implementing Redis safely in this workspace.
It is written as a manual step-by-step checklist, and I did not change your project files automatically.

Project context:
- Backend folder: kanbanbackend
- Framework: Laravel
- PHP version in composer.json: 8.3+
- Redis package already present in composer.json: predis/predis

---

## 1. Understand what Redis will be used for

You can use Redis for one or more of these in a Laravel app:
- Cache
- Session storage
- Queue jobs
- Rate limiting

For this project, the most common beginner setup is:
- Cache via Redis
- Sessions via Redis
- Queue jobs via Redis

---

## 2. Install Redis on Debian 13

Run these commands in your terminal:

```bash
sudo apt update
sudo apt install -y redis-server redis-tools
```

If you are using PHP 8.3, also install the PHP Redis extension:

```bash
sudo apt install -y php-redis
```

If Debian does not find `php-redis`, try the versioned package:

```bash
sudo apt install -y php8.3-redis
```

---

## 3. Start and enable Redis

Start the service:

```bash
sudo systemctl enable --now redis-server
```

Check the service status:

```bash
sudo systemctl status redis-server
```

Test Redis manually:

```bash
redis-cli ping
```

Expected result:

```text
PONG
```

---

## 4. Confirm Laravel already has Redis support

Your backend already includes the Redis-compatible package in composer.json:

```json
"predis/predis": "^3.5"
```

That means Laravel can talk to Redis without needing to add a new package manually.

You can verify the dependency is installed by running:

```bash
cd kanbanbackend
composer show predis/predis
```

---

## 5. Open the Laravel environment file manually

Open the backend environment file:

```bash
cd kanbanbackend
nano .env
```

If you want to compare with the example file first:

```bash
nano .env.example
```

---

## 6. Add Redis values to the backend .env file

Add or update these lines in your backend .env file.

Example values:

```env
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=0
```

Optional but useful:

```env
CACHE_PREFIX=kanban-cache
```

Important:
- `REDIS_HOST=127.0.0.1` means Redis is running locally.
- `REDIS_PORT=6379` is the default Redis port.
- `REDIS_PASSWORD=null` is fine for a local development setup.

If you later want a password-protected setup, you would change it to a real password and update Redis config accordingly.

---

## 7. Make sure Laravel uses Redis for cache and sessions

Laravel already has Redis cache support in the backend config file:

- config/cache.php

The default cache store is currently set to file. You can switch it to Redis by setting:

```env
CACHE_STORE=redis
```

For sessions, the key is:

```env
SESSION_DRIVER=redis
```

For queues:

```env
QUEUE_CONNECTION=redis
```

---

## 8. Clear Laravel config and test the connection

After editing .env, run:

```bash
cd kanbanbackend
php artisan config:clear
php artisan cache:clear
```

Now test Redis connection with:

```bash
php artisan tinker --execute="Cache::put('redis-test', 'ok', 60); echo Cache::get('redis-test');"
```

Expected output:

```text
ok
```

This confirms that Laravel can read and write to Redis.

---

## 9. Test session storage with Redis

You can verify sessions are being handled by Redis by starting the app and logging in or visiting a page that creates a session.

Start the app:

```bash
cd kanbanbackend
php artisan serve
```

Then open your browser and interact with the app.

If you want to inspect Redis directly:

```bash
redis-cli
KEYS *
```

You may see session keys or cache keys appear.

---

## 10. Optional: test queue jobs with Redis

If your app uses Laravel queues, you can test Redis queue support with:

```bash
cd kanbanbackend
php artisan queue:work
```

If you have a job ready to dispatch, that queue worker will process it from Redis.

---

## 11. Use Redis to cache workspaces and tasks

You can use Redis to cache data such as:
- workspace listings
- workspace details
- task lists
- task details

This is useful when the same data is requested many times and you want to reduce database load.

### 11.1. Basic cache pattern in Laravel

Use the cache helper or the Cache facade.

Example:

```php
use Illuminate\Support\Facades\Cache;

$workspace = Cache::remember('workspace:' . $workspaceId, 60, function () use ($workspaceId) {
    return WorkSpace::find($workspaceId);
});
```

This means:
- try Redis first
- if the key is missing, query the database
- store the result in Redis for 60 seconds

### 11.2. Cache a task list

Example:

```php
use Illuminate\Support\Facades\Cache;

$tasks = Cache::remember('tasks:workspace:' . $workspaceId, 120, function () use ($workspaceId) {
    return Task::where('workspace_id', $workspaceId)->get();
});
```

### 11.3. Clear a specific cached key

When a workspace or task is updated, clear the related cache key:

```php
Cache::forget('workspace:' . $workspaceId);
Cache::forget('tasks:workspace:' . $workspaceId);
```

### 11.4. Clear all Redis cache

If you want to clear all cached values:

```bash
cd kanbanbackend
php artisan cache:clear
```

---

## 12. Verify Redis caching is working

### 12.1. Verify from Laravel

Run this in tinker:

```bash
cd kanbanbackend
php artisan tinker --execute="Cache::put('kanban-demo', ['workspace' => 1, 'task' => 2], 60); echo json_encode(Cache::get('kanban-demo'));"
```

Expected output:

```json
{"workspace":1,"task":2}
```

### 12.2. Verify from Redis directly

Open Redis CLI:

```bash
redis-cli
```

Then inspect keys:

```bash
KEYS *
```

You should see keys created by Laravel or your cache operations.

### 12.3. Verify in your app flow

A simple way to confirm it is working in practice:
1. Load a workspace or task list once.
2. Check that Laravel fetches it from Redis on the next request.
3. Update the workspace/task.
4. Clear the related cache key.
5. Reload the page and confirm fresh data appears.

### 12.4. Quick manual verification checklist

- Redis is running: `sudo systemctl status redis-server`
- Redis responds: `redis-cli ping`
- Laravel can write cache: `php artisan tinker --execute="Cache::put('redis-test', 'ok', 60); echo Cache::get('redis-test');"`
- Cache key appears in Redis: `redis-cli` then `KEYS *`

---

## 13. Useful commands for daily use

Check Redis is running:

```bash
sudo systemctl status redis-server
```

Restart Redis:

```bash
sudo systemctl restart redis-server
```

Check Redis from terminal:

```bash
redis-cli ping
```

Clear Laravel cache:

```bash
cd kanbanbackend
php artisan cache:clear
```

---

## 12. Common problems and fixes

### Problem: `redis-cli ping` returns connection refused

Fix:
```bash
sudo systemctl start redis-server
sudo systemctl status redis-server
```

### Problem: Laravel says Redis connection failed

Check:
- Redis is running
- `.env` values are correct
- `REDIS_HOST` is not a typo
- `REDIS_PORT` is `6379`

### Problem: PHP extension is missing

Check:
```bash
php -m | grep redis
```

If nothing appears, install the extension again:

```bash
sudo apt install -y php-redis
```

Or the versioned package:

```bash
sudo apt install -y php8.3-redis
```

---

## 13. Recommended next step

For a production-like setup, the next improvement would be:
- protect Redis with a password
- bind Redis only to localhost or a private network
- use Redis for cache, sessions, and queues together

For local development, the setup above is enough to learn and test Redis safely.

---

## 14. Quick copy-paste summary

```bash
sudo apt update
sudo apt install -y redis-server redis-tools php-redis
sudo systemctl enable --now redis-server
redis-cli ping

cd kanbanbackend
cp .env.example .env 2>/dev/null || true
```

Then manually edit `.env` and add:

```env
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=0
```

Finally:

```bash
php artisan config:clear
php artisan cache:clear
php artisan tinker --execute="Cache::put('redis-test', 'ok', 60); echo Cache::get('redis-test');"
```
