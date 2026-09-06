<?php

use App\Http\Controllers\AdminMemberController;
use App\Http\Controllers\AdminStaffController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MemberHomeController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\OverviewController;
use App\Http\Controllers\PaymongoWebhookController;
use App\Http\Controllers\StaffDashboardController;
use App\Http\Controllers\StaffMemberController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/onboarding', [OnboardingController::class, 'index'])->name('onboarding.index');
    Route::post('/onboarding/complete', [OnboardingController::class, 'complete'])->name('onboarding.complete');
    Route::post('/onboarding/skip', [OnboardingController::class, 'skip'])->name('onboarding.skip');

    Route::get('/overview', [OverviewController::class, 'index'])->name('overview')
        ->middleware('role:admin');
    Route::get('/members', [AdminMemberController::class, 'index'])
        ->middleware('role:admin')
        ->name('members.index');
    Route::get('/members/{user}', [AdminMemberController::class, 'show'])
        ->middleware('role:admin')
        ->name('members.show');

    Route::get('/staffs', [AdminStaffController::class, 'index'])
        ->middleware('role:admin');


    Route::get('/onboarding/payment/return/{invoice}', [OnboardingController::class, 'paymentReturn'])
        ->name('onboarding.payment.return');


    Route::get('/onboarding/invoices/{invoice}/status', [OnboardingController::class, 'invoiceStatus'])
        ->name('onboarding.invoice.status');
    Route::middleware('subscribed')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    });

    Route::get('/staff/dashboard', [StaffDashboardController::class, 'index'])
        ->middleware('role:staff')
        ->name('staff.dashboard');
    Route::get('/staff/members', [StaffMemberController::class, 'index'])
        ->middleware('role:staff')
        ->name('staff.members');

    Route::get('/staff/members/{user}', [StaffMemberController::class, 'show'])
        ->middleware('role:staff')
        ->name('staff.members.show');



    Route::get('/staffs', [AdminStaffController::class, 'index'])
        ->middleware('role:admin')
        ->name('staffs.index');
    Route::post('/staffs', [AdminStaffController::class, 'store'])
        ->middleware('role:admin')
        ->name('staffs.store');
    Route::patch('/staffs/{user}/deactivate', [AdminStaffController::class, 'deactivate'])
        ->middleware('role:admin')
        ->name('staffs.deactivate');
    Route::patch('/staffs/{user}/activate', [AdminStaffController::class, 'activate'])
        ->middleware('role:admin')
        ->name('staffs.activate');
});

Route::post('/webhooks/paymongo', [PaymongoWebhookController::class, 'handle'])
    ->name('webhooks.paymongo');

require __DIR__ . '/settings.php';
