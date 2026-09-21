<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
  public function index(Request $request)
  {
    return response()->json(
      $request->user()->notifications()->limit(20)->get()
    );
  }

  public function markRead(Request $request, string $id)
  {
    $request->user()->notifications()->where('id', $id)->first()?->markAsRead();
    return response()->noContent();
  }

  public function markAllRead(Request $request)
  {
    $request->user()->unreadNotifications->markAsRead();
    return response()->noContent();
  }
}
