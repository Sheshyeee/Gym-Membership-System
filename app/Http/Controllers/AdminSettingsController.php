<?php

namespace App\Http\Controllers;

use App\Models\GymProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use App\Models\User;


class AdminSettingsController extends Controller
{
    public function index(Request $request)
    {
        $gymProfile = GymProfile::current();

        return inertia('admin/settings', [
            'gymProfile' => [
                'name' => $gymProfile->name,
                'phone' => $gymProfile->phone,
                'address' => $gymProfile->address,
                'about' => $gymProfile->about,
                'cover_url' => $gymProfile->cover_url,
            ],
            'adminEmail' => $request->user()->email,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($request->user()->id),
            ],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'about' => ['nullable', 'string', 'max:2000'],
            'cover' => ['nullable', 'image', 'max:2048'],
        ]);

        $gymProfile = GymProfile::current();

        if ($request->hasFile('cover')) {
            if ($gymProfile->cover_path) {
                Storage::disk('public')->delete($gymProfile->cover_path);
            }
            $validated['cover_path'] = $request->file('cover')->store('gym', 'public');
        }

        $gymProfile->update([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'about' => $validated['about'] ?? null,
            'cover_path' => $validated['cover_path'] ?? $gymProfile->cover_path,
        ]);

        /** @var User $user */
        $user = $request->user();
        $user->update(['email' => $validated['email']]);

        return back()->with('success', 'Gym profile updated.');
    }
}
