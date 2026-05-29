<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('chat.{conversationId}', function ($user, string $conversationId) {
    $userIds = explode('_', $conversationId);
    return in_array((string) $user->id, $userIds);
});

Broadcast::channel('online', function ($user) {
    return [
        'id' => $user->id,
        'name' => $user->name,
    ];
});

