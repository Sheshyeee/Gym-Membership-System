<?php

namespace App\Http\Middleware;

use App\Models\GymProfile;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $gymProfile = $request->attributes->get('gymProfile') ?? GymProfile::current();
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'gymProfile' => [
                'name' => $gymProfile->name,
                'cover_url' => $gymProfile->cover_url,
            ],
            'auth' => [
                'user' => $user,
                'roles' => $user?->getRoleNames()->toArray() ?? [],
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'notifications' => $user ? [
                'unread_count' => $user->unreadNotifications()->count(),
                'items' => $user->notifications()
                    ->limit(10)
                    ->get()
                    ->map(fn($n) => [
                        'id' => $n->id,
                        'type' => $n->data['type'] ?? null,
                        'title' => $n->data['title'] ?? '',
                        'body' => $n->data['body'] ?? '',
                        'read' => $n->read_at !== null,
                        'created_at' => $n->created_at->diffForHumans(),
                    ]),
            ] : null,
        ];
    }
}
