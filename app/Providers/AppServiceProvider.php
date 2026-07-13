<?php

namespace App\Providers;

use App\Enums\AuditLogAction;
use App\Models\AuditLog;
use App\Models\Product;
use App\Models\User;
use App\Observers\ProductObserver;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

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
        $this->configureDefaults();

        Model::preventLazyLoading(! app()->isProduction());
        Product::observe(ProductObserver::class);
        $this->configureAuthenticationAudit();

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('checkout', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('attendance', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });
    }

    private function configureAuthenticationAudit(): void
    {
        Event::listen(Login::class, function (Login $event): void {
            if (! $event->user instanceof User) {
                return;
            }

            $this->writeAuthenticationAudit(AuditLogAction::LOGIN, $event->user, [
                'guard' => $event->guard,
            ]);
        });

        Event::listen(Failed::class, function (Failed $event): void {
            $user = $event->user instanceof User ? $event->user : null;

            $this->writeAuthenticationAudit(AuditLogAction::FAILED_LOGIN, $user, [
                'guard' => $event->guard,
                'email' => mb_strtolower((string) ($event->credentials['email'] ?? '')),
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function writeAuthenticationAudit(AuditLogAction $action, ?User $user, array $context): void
    {
        AuditLog::query()->create([
            'store_id' => $user?->store_id,
            'user_id' => $user?->id,
            'action' => $action,
            'auditable_type' => $user?->getMorphClass(),
            'auditable_id' => $user?->getKey(),
            'new_values' => $context,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
