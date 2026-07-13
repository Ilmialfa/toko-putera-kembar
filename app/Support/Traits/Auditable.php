<?php

namespace App\Support\Traits;

use App\Enums\AuditLogAction;
use App\Models\AuditLog;
use App\Support\CurrentStoreResolver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function (Model $model) {
            self::writeAuditLog($model, AuditLogAction::CREATE, null, $model->getAttributes());
        });

        static::updated(function (Model $model) {
            self::writeAuditLog($model, AuditLogAction::UPDATE, $model->getOriginal(), $model->getChanges());
        });

        static::deleted(function (Model $model) {
            self::writeAuditLog($model, AuditLogAction::DELETE, $model->getOriginal(), null);
        });
    }

    /**
     * @param  array<string, mixed>|null  $oldValues
     * @param  array<string, mixed>|null  $newValues
     */
    private static function writeAuditLog(Model $model, AuditLogAction $action, ?array $oldValues, ?array $newValues): void
    {
        AuditLog::create([
            'store_id' => app(CurrentStoreResolver::class)->getStoreId(),
            'user_id' => Auth::id(),
            'action' => $action,
            'auditable_type' => $model->getMorphClass(),
            'auditable_id' => $model->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
