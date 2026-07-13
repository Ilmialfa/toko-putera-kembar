<?php

use App\Jobs\CheckExpiringProductsJob;
use App\Jobs\ReleaseExpiredReservationsJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new ReleaseExpiredReservationsJob)
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::job(new CheckExpiringProductsJob)
    ->dailyAt('06:00')
    ->withoutOverlapping()
    ->onOneServer();
