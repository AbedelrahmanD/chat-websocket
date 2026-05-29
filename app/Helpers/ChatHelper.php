<?php

namespace App\Helpers;

class ChatHelper
{
    public static function getConversationId(int $user1, int $user2): string
    {
        return min($user1, $user2) . '_' . max($user1, $user2);
    }
}
