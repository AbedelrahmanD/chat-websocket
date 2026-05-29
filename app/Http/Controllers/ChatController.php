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
            ->get(['id', 'name', 'email', 'avatar'])
            ->map(function ($user) use ($currentUserId) {
                $user->unread_count = Message::where('sender_id', $user->id)
                    ->where('receiver_id', $currentUserId)
                    ->whereNull('read_at')
                    ->count();

                // Get latest message between current user and this user
                $latestMessage = Message::where(function ($query) use ($currentUserId, $user) {
                    $query->where('sender_id', $currentUserId)->where('receiver_id', $user->id);
                })->orWhere(function ($query) use ($currentUserId, $user) {
                    $query->where('sender_id', $user->id)->where('receiver_id', $currentUserId);
                })->orderBy('created_at', 'desc')->first();

                $user->latest_message = $latestMessage;

                return $user;
            })
            ->sort(function ($a, $b) {
                $timeA = $a->latest_message ? $a->latest_message->created_at->timestamp : 0;
                $timeB = $b->latest_message ? $b->latest_message->created_at->timestamp : 0;

                if ($timeA !== $timeB) {
                    return $timeB <=> $timeA;
                }

                return strcasecmp($a->name, $b->name);
            })
            ->values();

        return Inertia::render('Chat', [
            'users' => $users,
        ]);
    }
}
