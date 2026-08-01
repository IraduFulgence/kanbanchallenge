<?php

namespace App\Providers;

use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // this is an API-only backend — there's no "login" web route to redirect
        // unauthenticated users to, so just let the JSON 401 handler in
        // bootstrap/app.php deal with it instead of trying to build a redirect
        Authenticate::redirectUsing(fn () => null);
    }
}
