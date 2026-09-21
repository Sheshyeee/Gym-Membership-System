<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberSearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('q', ''));

        if ($query === '') {
            return response()->json(['results' => []]);
        }

        $users = User::query()
            ->role('user')
            ->with('latestSubscription.plan')
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%");

                // Also allow matching by member code / raw id, e.g. "MEM-0042" or "42"
                if (preg_match('/(\d+)/', $query, $m)) {
                    $q->orWhere('id', (int) $m[1]);
                }
            })
        ->limit(8)
            ->get();

        $isAdmin = $request->user()->hasRole('admin');

        $results = $users->map(fn(User $user) => [
            'id' => $user->id,
            'code' => 'MEM-' . str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
            'name' => $user->name,
            'email' => $user->email,
            'plan' => $user->latestSubscription?->plan?->name,
            // admins land on /members/{id}, staff on /staff/members/{id}
            'url' => $isAdmin ? "/members/{$user->id}" : "/staff/members/{$user->id}",
        ]);

        return response()->json(['results' => $results]);
    }
}