<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Throwable;

class RedisRateLimiter
{
    public function handle(Request $request, Closure $next, int $limit = 60, int $window = 60)
    {
        $key = 'rate_limit:' . $request->ip() . ':' . md5($request->route()->uri());

        try {
            $current = Redis::incr($key);

            if ($current === 1) {
                Redis::expire($key, $window);
            }

            if ($current > $limit) {
                return response()->json([
                    'message' => 'Too many requests. Please try again later.',
                    'retry_after' => Redis::ttl($key),
                    'limit' => $limit,
                ], 429);
            }
        } catch (Throwable $e) {
            Log::warning('Redis rate limiter unavailable, skipping rate limiting.', [
                'exception' => $e->getMessage(),
                'ip' => $request->ip(),
                'route' => $request->route()?->uri(),
            ]);

            return $next($request);
        }

        return $next($request);
    }
}
