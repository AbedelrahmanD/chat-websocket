<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use App\Helpers\ChatHelper;
use App\Services\PushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Gate;
use App\Events\MessageSent;
use App\Events\MessageUpdated;
use App\Events\MessageDeleted;
use App\Events\UserTyping;
use App\Events\MessagesRead;

class MessageController extends Controller
{
    public function index(Request $request, User $user): JsonResponse
    {
        $currentUserId = Auth::id();
        $otherUserId = $user->id;
        $conversationId = ChatHelper::getConversationId($currentUserId, $otherUserId);

        // Mark unread messages sent by the other user to us as read
        $readAt = now()->toIso8601String();
        $updatedCount = Message::where('conversation_id', $conversationId)
            ->where('sender_id', $otherUserId)
            ->where('receiver_id', $currentUserId)
            ->whereNull('read_at')
            ->update(['read_at' => $readAt]);

        if ($updatedCount > 0) {
            broadcast(new MessagesRead($conversationId, $currentUserId, $readAt))->toOthers();
        }

        $messages = Message::where('conversation_id', $conversationId)
            ->with('parent')
            ->orderBy('created_at', 'desc')
            ->cursorPaginate(30);

        return response()->json($messages);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'body' => 'nullable|string|max:5000',
            'file' => 'nullable|file|max:10240',
            'is_audio' => 'nullable|boolean',
            'parent_id' => 'nullable|exists:messages,id',
            'file_path' => 'nullable|string',
            'file_name' => 'nullable|string',
            'file_type' => 'nullable|string',
            'file_size' => 'nullable|integer',
            'is_forwarded' => 'nullable|boolean',
        ]);

        $filePath = $data['file_path'] ?? null;
        $fileName = $data['file_name'] ?? null;
        $fileType = $data['file_type'] ?? null;
        $fileSize = $data['file_size'] ?? null;
        $isAudio = filter_var($request->input('is_audio'), FILTER_VALIDATE_BOOLEAN);
        $isForwarded = filter_var($request->input('is_forwarded'), FILTER_VALIDATE_BOOLEAN);

        if ($request->hasFile('file')) {
            $uploadedFile = $request->file('file');
            $fileName = $uploadedFile->getClientOriginalName();
            $fileType = $uploadedFile->getClientMimeType();
            $fileSize = $uploadedFile->getSize();
            $filePath = $uploadedFile->store('attachments', 'public');
        }

        $message = Message::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $data['receiver_id'],
            'body' => $data['body'] ?? null,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_type' => $fileType,
            'file_size' => $fileSize,
            'is_audio' => $isAudio,
            'parent_id' => $data['parent_id'] ?? null,
            'is_forwarded' => $isForwarded,
        ]);

        $message->load('parent');

        broadcast(new MessageSent($message))->toOthers();

        // Send push notification if recipient is offline on WebSockets
        $receiver = User::find($data['receiver_id']);
        if ($receiver && !$receiver->isOnline()) {
            $senderName = Auth::user()->name;
            $notificationBody = $message->is_audio 
                ? '🎤 Sent a voice note' 
                : ($message->file_path ? '📁 Sent a file attachment' : $message->body);

            PushService::sendNotification(
                $receiver,
                "New message from {$senderName}",
                $notificationBody,
                ['url' => '/chat']
            );
        }

        return response()->json($message, 201);
    }

    public function update(Request $request, Message $message): JsonResponse
    {
        if ($message->sender_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'body' => 'required|string|max:5000',
        ]);

        $message->update([
            'body' => $data['body'],
        ]);

        $message->load('parent');

        broadcast(new MessageUpdated($message))->toOthers();

        return response()->json($message);
    }

    public function destroy(Message $message): JsonResponse
    {
        if ($message->sender_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $messageId = $message->id;
        $conversationId = $message->conversation_id;
        $message->delete();

        broadcast(new MessageDeleted($messageId, $conversationId))->toOthers();

        return response()->json(null, 204);
    }

    public function typing(Request $request): JsonResponse
    {
        $data = $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'is_typing' => 'required|boolean',
        ]);

        $currentUserId = Auth::id();
        $receiverId = $data['receiver_id'];
        $conversationId = ChatHelper::getConversationId($currentUserId, $receiverId);

        broadcast(new UserTyping($currentUserId, $conversationId, $data['is_typing']))->toOthers();

        return response()->json(null, 204);
    }

    public function markAsRead(User $user): JsonResponse
    {
        $currentUserId = Auth::id();
        $senderId = $user->id;
        $conversationId = ChatHelper::getConversationId($currentUserId, $senderId);

        $readAt = now()->toIso8601String();
        Message::where('conversation_id', $conversationId)
            ->where('sender_id', $senderId)
            ->where('receiver_id', $currentUserId)
            ->whereNull('read_at')
            ->update(['read_at' => $readAt]);

        broadcast(new MessagesRead($conversationId, $currentUserId, $readAt))->toOthers();

        return response()->json(null, 204);
    }
}
