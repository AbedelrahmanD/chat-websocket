<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function index(Request $request): Response
    {
        $currentUserId = Auth::id();
        $users = User::where('id', '!=', $currentUserId)
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(function ($user) use ($currentUserId) {
                $user->unread_count = Message::where('sender_id', $user->id)
                    ->where('receiver_id', $currentUserId)
                    ->whereNull('read_at')
                    ->count();
                return $user;
            });

        return Inertia::render('Chat', [
            'users' => $users,
        ]);
    }
}
