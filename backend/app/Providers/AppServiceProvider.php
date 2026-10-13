<?php

namespace App\Providers;

use App\Contracts\PaymentGateway;
use App\Services\Gateways\SandboxGateway;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // No real provider is wired up yet. The sandbox settles every attempt
        // without moving money, so it is only handed out in local and testing;
        // anywhere else the container fails loudly instead of marking orders
        // paid for free.
        $this->app->bind(PaymentGateway::class, function () {
            if ($this->app->environment(['local', 'testing'])) {
                return new SandboxGateway;
            }

            throw new RuntimeException(
                'هیچ درگاه پرداخت واقعی تنظیم نشده است؛ اتصال PaymentGateway را در AppServiceProvider جایگزین کنید.',
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(60)
            ->by($request->user()?->id ?: $request->ip()));
    }
}
