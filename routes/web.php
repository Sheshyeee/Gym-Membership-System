<?php

use App\Http\Controllers\AdminMemberController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MemberHomeController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\OverviewController;
use App\Http\Controllers\PaymongoWebhookController;
use App\Http\Controllers\StaffDashboardController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/onboarding', [OnboardingController::class, 'index'])->name('onboarding.index');
    Route::post('/onboarding/complete', [OnboardingController::class, 'complete'])->name('onboarding.complete');
    Route::post('/onboarding/skip', [OnboardingController::class, 'skip'])->name('onboarding.skip');

    Route::get('/admin/dashboard', [OverviewController::class, 'index'])->name('overview')
        ->middleware('role:admin');
    Route::get('/members', [AdminMemberController::class, 'index'])
        ->middleware('role:admin')
        ->name('members.index');
    Route::get('/members/{user}', [AdminMemberController::class, 'show'])
        ->middleware('role:admin')
        ->name('members.show');


    Route::get('/onboarding/payment/return/{invoice}', [OnboardingController::class, 'paymentReturn'])
        ->name('onboarding.payment.return');


    Route::get('/onboarding/invoices/{invoice}/status', [OnboardingController::class, 'invoiceStatus'])
        ->name('onboarding.invoice.status');
    Route::middleware('subscribed')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    });
});

Route::post('/webhooks/paymongo', [PaymongoWebhookController::class, 'handle'])
    ->name('webhooks.paymongo');

require __DIR__ . '/settings.php';
