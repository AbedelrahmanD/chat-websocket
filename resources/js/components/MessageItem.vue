<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { Edit2, Trash2, Check, X, FileText, Download, CheckCheck } from '@lucide/vue';
import linkifyHtml from 'linkify-html';
import type { Message } from '@/types/chat';
import VoicePlayer from '@/components/VoicePlayer.vue';
import { useChat } from '@/composables/useChat';
import { formatFileSize, formatMessageTime } from '@/lib/utils';

const props = defineProps<{
    message: Message;
}>();

const { currentUser, updateMessage, deleteMessage } = useChat();

const isEditing = ref(false);
const isSaving = ref(false);
const localEditBody = ref('');

const adjustTextareaHeight = (event: Event): void => {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
};

const startEdit = async (): Promise<void> => {
    const bubble = document.querySelector(`[data-message-id="${props.message.id}"] .bubble-sent, [data-message-id="${props.message.id}"] .bubble-received`) as HTMLElement | null;
    const originalHeight = bubble ? bubble.offsetHeight : null;

    isEditing.value = true;
    localEditBody.value = props.message.body || '';

    await nextTick();
    const textarea = document.querySelector(`[data-message-id="${props.message.id}"] textarea`) as HTMLTextAreaElement | null;
    if (textarea && originalHeight) {
        const height = Math.max(originalHeight - 16, 36);
        textarea.style.height = `${height}px`;
    }
};

const cancelEdit = (): void => {
    isEditing.value = false;
    localEditBody.value = '';
};

const handleSave = async (): Promise<void> => {
    const trimmed = localEditBody.value.trim();
    if (!trimmed || trimmed === props.message.body) {
        cancelEdit();
        return;
    }

    try {
        isSaving.value = true;
        await updateMessage(props.message.id, trimmed);
        cancelEdit();
    } catch (error) {
        console.error(error);
    } finally {
        isSaving.value = false;
    }
};

const handleDelete = async (): Promise<void> => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
        await deleteMessage(props.message.id);
    } catch (error) {
        console.error(error);
    }
};

const formatMessageBody = (body: string): string => {
    return linkifyHtml(body, {
        target: '_blank',
        rel: 'noopener noreferrer',
    });
};
</script>

<template>
    <div :data-message-id="message.id" class="message-row group"
        :class="message.sender_id === currentUser?.id ? 'message-row-sent' : 'message-row-received'">

        <div v-if="message.sender_id === currentUser?.id && !isEditing" class="message-actions-wrapper">
            <button @click="startEdit" class="message-action-btn" title="Edit Message">
                <Edit2 class="h-3 w-3" />
            </button>
            <button @click="handleDelete" class="message-action-btn message-action-btn-danger" title="Delete Message">
                <Trash2 class="h-3 w-3" />
            </button>
        </div>

        <div :class="isEditing ? 'w-full' : 'w-fit'" class="max-w-[75%] sm:max-w-md md:max-w-lg">
            <div v-if="isEditing"
                class="flex w-full items-center space-x-2 bg-white rounded-xl border border-slate-200 p-2 shadow-sm">
                <textarea v-model="localEditBody" dir="auto" rows="1" :disabled="isSaving"
                    class="flex-1 text-sm text-slate-800 bg-transparent px-2 focus:outline-none resize-none overflow-y-auto min-h-[36px]"
                    @input="adjustTextareaHeight" @keydown.enter.exact.prevent="handleSave"
                    @keydown.esc="cancelEdit"></textarea>
                <button @click="handleSave" :disabled="isSaving"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100 focus:outline-none disabled:opacity-50">
                    <Check class="h-3.5 w-3.5" />
                </button>
                <button @click="cancelEdit" :disabled="isSaving"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-slate-100 focus:outline-none disabled:opacity-50">
                    <X class="h-3.5 w-3.5" />
                </button>
            </div>

            <div v-else :class="message.sender_id === currentUser?.id ? 'bubble-sent' : 'bubble-received'">
                <p v-if="message.body" dir="auto" class="whitespace-pre-wrap" v-html="formatMessageBody(message.body)">
                </p>

                <div v-if="message.is_audio && message.file_url" class="mt-2">
                    <VoicePlayer :src="message.file_url" :isSent="message.sender_id === currentUser?.id" />
                </div>

                <div v-else-if="message.file_url && message.file_type?.startsWith('image/')" class="mt-2 flex flex-col">
                    <a :href="message.file_url" data-fancybox="gallery" :data-caption="message.file_name" class="block">
                        <img :src="message.file_url" class="attachment-image" />
                    </a>
                    <a :href="message.file_url" :download="message.file_name"
                        class="flex items-center space-x-1 text-[11px] font-medium transition hover:underline mt-1"
                        :class="message.sender_id === currentUser?.id ? 'text-indigo-100/90 hover:text-white justify-end' : 'text-indigo-600 hover:text-indigo-700 justify-start'">
                        <Download class="h-3.5 w-3.5" />
                        <span>Download</span>
                    </a>
                </div>

                <div v-else-if="message.file_url" class="mt-2">
                    <a :href="message.file_url" :download="message.file_name" class="attachment-card"
                        :class="{ 'attachment-card-sent text-white border-white/10': message.sender_id === currentUser?.id }">
                        <div class="attachment-icon-wrapper"
                            :class="{ 'attachment-icon-wrapper-sent': message.sender_id === currentUser?.id }">
                            <FileText class="h-5 w-5" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-semibold truncate">{{ message.file_name }}
                            </p>
                            <p class="text-[10px] opacity-70 mt-0.5">{{
                                formatFileSize(message.file_size) }}</p>
                        </div>
                        <Download class="h-4 w-4 shrink-0 opacity-70 hover:opacity-100 transition" />
                    </a>
                </div>

                <div class="flex items-center mt-1 space-x-1 select-none font-medium opacity-70 text-[10px]"
                    :class="message.sender_id === currentUser?.id ? 'text-indigo-100 justify-end' : 'text-slate-400 justify-start'">
                    <span>
                        {{ formatMessageTime(message.created_at) }}
                    </span>
                    <template v-if="message.sender_id === currentUser?.id">
                        <CheckCheck v-if="message.read_at" class="h-3.5 w-3.5 text-emerald-300" />
                        <Check v-else class="h-3.5 w-3.5 opacity-60" />
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>
