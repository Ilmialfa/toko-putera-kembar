<?php

use App\Domain\HR\Controllers\AttendanceController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/hr/attendances/record', [AttendanceController::class, 'record'])
    ->middleware(['auth:sanctum', 'throttle:attendance']);
