<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminStaffController extends Controller
{
    private const ROLES = ['Manager', 'Gym Staff', 'Receptionist'];

    public function index(): Response
    {
        $staff = User::query()
            ->whereNotNull('staff_role')
            ->latest()
            ->get()
            ->map(fn(User $user) => $this->transform($user));

        return Inertia::render('admin/staff', [
            'staff' => $staff,
            'roles' => self::ROLES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'role' => ['required', Rule::in(self::ROLES)],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'staff_role' => $validated['role'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make(Str::random(32)),
        ]);

        $user->assignRole('staff');

        return back()->with('success', 'Staff member added.');
    }

    public function deactivate(User $user): RedirectResponse
    {
        $user->update(['deactivated_at' => now()]);

        return back()->with('success', 'Staff member deactivated.');
    }

    public function activate(User $user): RedirectResponse
    {
        $user->update(['deactivated_at' => null]);

        return back()->with('success', 'Staff member reactivated.');
    }

    private function transform(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->staff_role,
            'phone' => $user->phone,
            'is_active' => $user->isActive(),
            'last_active' => '—', // stubbed, no login tracking yet
        ];
    }
}
