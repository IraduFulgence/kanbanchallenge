<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class CacheResponse
{
    public function handle(Request $request, Closure $next, int $ttl = 300)
    {
        // Only cache GET requests
        if (!$request->isMethod('get')) {
            return $next($request);
        }

        // Skip cache for authenticated requests with cache-control header
        if ($request->headers->has('Cache-Control') && 
            str_contains($request->headers->get('Cache-Control'), 'no-cache')) {
            return $next($request);
        }

        // Generate cache key based on URL and query parameters
        $key = 'response:' . md5($request->fullUrl());

        // Check if cached response exists
        if (Cache::has($key)) {
            $cachedResponse = Cache::get($key);
            return response($cachedResponse['content'])
                ->withHeaders($cachedResponse['headers'])
                ->header('X-Cache', 'HIT');
        }

        // Get response
        $response = $next($request);

        // Cache the response if successful
        if ($response->isSuccessful()) {
            Cache::put($key, [
                'content' => $response->getContent(),
                'headers' => $response->headers->all(),
            ], $ttl);
            
            $response->header('X-Cache', 'MISS');
        }

        return $response;
    }
}