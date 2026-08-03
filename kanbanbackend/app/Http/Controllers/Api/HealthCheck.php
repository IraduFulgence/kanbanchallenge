<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class HealthCheck extends Controller
{
    //
    public function check()
    {
        $status = [
            'status' => 'healthy',
            'timestamp' => now()->toISOString(),
            'services' => [
                'redis' => $this->checkRedis(),
                'cache' => $this->checkCache(),
                'database' => $this->checkDatabase(),
            ],
        ];

        return response()->json($status);
    }

    private function checkRedis(): array
    {
        return [
            'status' => 'skipped',
            'message' => 'Redis is not configured for this environment.',
        ];
    }

    private function checkCache(): array
    {
        try {
            Cache::put('health_check', 'ok', 10);
            $value = Cache::get('health_check');
            
            return [
                'status' => 'working',
                'driver' => config('cache.default'),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage(),
            ];
        }
    }

    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();
            return [
                'status' => 'connected',
                'connection' => config('database.default'),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage(),
            ];
        }
    }
}
