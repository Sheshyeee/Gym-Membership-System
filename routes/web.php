<?php

use App\Http\Controllers\AdminAttendanceController;
use App\Http\Controllers\AdminMemberController;
use App\Http\Controllers\AdminPaymentController;
use App\Http\Controllers\AdminPlansController;
use App\Http\Controllers\AdminStaffController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MemberActivityController;

use App\Http\Controllers\MemberMembershipController;
use App\Http\Controllers\MemberPaymentController;
use App\Http\Controllers\MemberProfileController;
use App\Http\Controllers\MemberSearchController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\OverviewController;
use App\Http\Controllers\StaffPaymentController;
use App\Http\Controllers\PaymongoWebhookController;
use App\Http\Controllers\QRAccessController;
use App\Http\Controllers\StaffAttendanceController;
use App\Http\Controllers\StaffCheckInsController;
use App\Http\Controllers\StaffDashboardController;
use App\Http\Controllers\StaffManualCheckInController;
use App\Http\Controllers\StaffMemberController;
use App\Http\Controllers\StaffProfileSettingsController;
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
    Route::get('/attendance', [AdminAttendanceController::class, 'index'])
        ->middleware('role:admin');
    Route::get('/payments', [AdminPaymentController::class, 'index'])
        ->middleware('role:admin');

    Route::get('/staff/qr-checkin', [StaffCheckInsController::class, 'index'])
        ->middleware('role:staff')
        ->name('staff.qr-checkin');
    Route::post('/staff/checkin/scan', [StaffCheckInsController::class, 'scan'])
        ->middleware('role:staff')
        ->name('staff.checkin.scan');
    Route::get('/staff/attendance', [StaffAttendanceController::class, 'index'])
        ->middleware('role:staff')
        ->name('staff.attendance');

    Route::get('/staff/profile', [StaffProfileSettingsController::class, 'index'])
        ->middleware('role:staff')
        ->name('staff.profile');



    Route::get('/onboarding/payment/return/{invoice}', [OnboardingController::class, 'paymentReturn'])
        ->name('onboarding.payment.return');


    Route::get('/onboarding/invoices/{invoice}/status', [OnboardingController::class, 'invoiceStatus'])
        ->name('onboarding.invoice.status');

    Route::get('/member/membership/checkout', [MemberMembershipController::class, 'checkout'])
        ->middleware('role:user')
        ->name('member.membership.checkout');
    Route::post('/member/membership/checkout', [MemberMembershipController::class, 'pay'])
        ->middleware('role:user')
        ->name('member.membership.pay');
    Route::get('/member/membership/payment/return/{invoice}', [MemberMembershipController::class, 'paymentReturn'])
        ->middleware('role:user')
        ->name('member.membership.payment.return');
    Route::get('/member/membership/invoices/{invoice}/status', [MemberMembershipController::class, 'invoiceStatus'])
        ->middleware('role:user')
        ->name('member.membership.invoice.status');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    Route::get('/member/profile', [MemberProfileController::class, 'index'])->name('member.profile');

    Route::middleware('subscribed')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/qraccess', [QRAccessController::class, 'index'])->name('qraccess');

        Route::get('/qraccess', [QRAccessController::class, 'index'])->name('qraccess');
        Route::post('/qraccess/regenerate', [QRAccessController::class, 'regenerate'])->name('qraccess.regenerate');
        Route::get('/member/payments', [MemberPaymentController::class, 'index'])
            ->middleware('role:user')
            ->name('member.payments');

        Route::get('/member/membership', [MemberMembershipController::class, 'index'])
            ->middleware('role:user')
            ->name('member.membership');
    });

    Route::get('/admin/plans', [AdminPlansController::class, 'index'])
        ->middleware('role:admin')
        ->name('admin.plans.index');

    Route::post('/admin/payments/{invoice}/refund', [AdminPaymentController::class, 'refund'])
        ->middleware('role:admin')
        ->name('admin.payments.refund');
    Route::post('/admin/payments/{invoice}/retry', [AdminPaymentController::class, 'retry'])
        ->middleware('role:admin')
        ->name('admin.payments.retry');

    Route::patch('/admin/plans/{plan}', [AdminPlansController::class, 'update'])
        ->middleware('role:admin')
        ->name('admin.plans.update');

    Route::get('/staff/dashboard', [StaffDashboardController::class, 'index'])
        ->middleware('role:staff')
        ->name('staff.dashboard');
    Route::get('/staff/members', [StaffMemberController::class, 'index'])
        ->middleware('role:staff')
        ->name('staff.members');

    Route::get('/staff/members/{user}', [StaffMemberController::class, 'show'])
        ->middleware('role:staff')
        ->name('staff.members.show');

    Route::get('/search/members', [MemberSearchController::class, 'search'])
    ->middleware('role:staff|admin')
    ->name('search.members');



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

    Route::get('/staff/members/{user}', [StaffMemberController::class, 'show'])
        ->middleware('role:staff')
        ->name('staff.members.show');

    Route::post('/staff/members/{user}/checkin', [StaffMemberController::class, 'checkin'])
        ->middleware('role:staff')
        ->name('staff.members.checkin');

    Route::get('/staff/payments', [StaffPaymentController::class, 'index'])
        ->middleware('role:staff')
        ->name('staff.payments');

    Route::get('/staff/payments/{invoice}', [StaffPaymentController::class, 'show'])
        ->middleware('role:staff')
        ->name('staff.payments.show');

    Route::get('/staff/manual-checkin', [StaffManualCheckInController::class, 'index'])
        ->middleware('role:staff')
        ->name('staff.manual-checkin');

    Route::get('/staff/manual-checkin/search', [StaffManualCheckInController::class, 'search'])
        ->middleware('role:staff')
        ->name('staff.manual-checkin.search');

    Route::post('/staff/manual-checkin/{user}/checkin', [StaffManualCheckInController::class, 'checkin'])
        ->middleware('role:staff')
        ->name('staff.manual-checkin.checkin');
});

Route::post('/webhooks/paymongo', [PaymongoWebhookController::class, 'handle'])
    ->name('webhooks.paymongo');

require __DIR__ . '/settings.php';
