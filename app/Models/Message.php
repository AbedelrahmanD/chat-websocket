<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Attributes\Fillable;

use App\Helpers\ChatHelper;

#[Fillable([
    'sender_id',
    'receiver_id',
    'conversation_id',
    'body',
    'read_at',
    'file_path',
    'file_name',
    'file_type',
    'file_size',
    'is_audio',
    'parent_id',
    'is_forwarded'
])]
class Message extends Model
{
    protected $appends = ['file_url'];

    protected static function booted(): void
    {
        static::creating(function (Message $message) {
            $message->conversation_id = ChatHelper::getConversationId($message->sender_id, $message->receiver_id);
        });
    }

    protected function fileUrl(): Attribute
    {
        return Attribute::get(fn () => $this->file_path ? asset('storage/' . $this->file_path) : null);
    }
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'is_audio' => 'boolean',
            'file_size' => 'integer',
            'is_forwarded' => 'boolean',
            'parent_id' => 'integer',
        ];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'parent_id');
    }
}
