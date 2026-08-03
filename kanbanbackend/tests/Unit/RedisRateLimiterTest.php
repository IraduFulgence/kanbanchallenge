<?php

namespace Tests\Unit;

use App\Http\Middleware\RedisRateLimiter;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class RedisRateLimiterTest extends TestCase
{
    public function test_it_allows_the_request_when_redis_is_unavailable(): void
    {
        $request = Request::create('/api/test', 'GET');
        $request->setRouteResolver(function () {
            return new Route('GET', '/api/test', ['uses' => fn () => null]);
        });

        Redis::shouldReceive('incr')->andThrow(new \RuntimeException('Redis unavailable'));

        $middleware = new RedisRateLimiter();
        $response = $middleware->handle($request, function ($request) {
            return response()->json(['ok' => true], 200);
        });

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('{"ok":true}', $response->getContent());
    }
}
