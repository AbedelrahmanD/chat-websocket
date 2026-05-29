<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import { Edit2, Trash2, Check, X, FileText, Download, CheckCheck, CornerUpLeft, Forward, MoreHorizontal, Copy } from '@lucide/vue';
import linkifyHtml from 'linkify-html';
import type { Message } from '@/types/chat';
import VoicePlayer from '@/components/VoicePlayer.vue';
import { useUsers } from '@/composables/useUsers';
import { useMessages } from '@/composables/useMessages';
import { formatFileSize, formatMessageTime } from '@/lib/utils';

const props = defineProps<{
    message: Message;
}>();

const emit = defineEmits<{
    (e: 'forward', message: Message): void;
}>();

const { currentUser, selectedUser } = useUsers();
const { updateMessage, deleteMessage, replyToMessage } = useMessages();

const isEditing = ref(false);
const isSaving = ref(false);
const localEditBody = ref('');
const showMenu = ref(false);
const menuRef = ref<HTMLElement | null>(null);

const toggleMenu = () => {
    showMenu.value = !showMenu.value;
};

const handleCopy = () => {
    if (props.message.body) {
        navigator.clipboard.writeText(props.message.body);
    }
    showMenu.value = false;
};

const clickOutsideMenu = (event: MouseEvent) => {
    if (showMenu.value && menuRef.value && !menuRef.value.contains(event.target as Node)) {
        showMenu.value = false;
    }
};

onMounted(() => {
    document.addEventListener('mousedown', clickOutsideMenu);
});

onUnmounted(() => {
    document.removeEventListener('mousedown', clickOutsideMenu);
});

const handleReply = () => {
    replyToMessage.value = props.message;
    const textarea = document.querySelector('footer textarea') as HTMLTextAreaElement | null;
    textarea?.focus();
};

const scrollToMessage = (parentId: number) => {
    const element = document.querySelector(`[data-message-id="${parentId}"]`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-blue-50/50');
        setTimeout(() => {
            element.classList.remove('bg-blue-50/50');
        }, 1000);
    }
};

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
    if (textarea) {
        textarea.focus();
        if (originalHeight) {
            const height = Math.max(originalHeight - 16, 36);
            textarea.style.height = `${height}px`;
        }
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
    <div :data-message-id="message.id" class="message-row group transition duration-300 rounded-lg p-1"
        :class="message.sender_id === currentUser?.id ? 'message-row-sent' : 'message-row-received'">

        <!-- Actions for sent messages (3 dots menu) -->
        <div v-if="message.sender_id === currentUser?.id && !isEditing" 
            class="message-actions-wrapper relative shrink-0"
            :class="{ 'opacity-100': showMenu }">
            <button type="button" @click.stop="toggleMenu" 
                class="message-action-btn"
                :class="{ 'text-zinc-600 border-zinc-300 bg-zinc-50': showMenu }"
                title="More Actions">
                <MoreHorizontal class="h-3.5 w-3.5" />
            </button>

            <!-- Dropdown Menu -->
            <div v-if="showMenu" ref="menuRef" 
                class="absolute bottom-full mb-1.5 z-30 w-32 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 animate-in fade-in duration-100 text-left right-0">
                <button v-if="message.body" type="button" @click="handleCopy"
                    class="w-full px-3 py-1.5 text-[10.5px] font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center space-x-2 transition focus:outline-none">
                    <Copy class="h-3.5 w-3.5 text-zinc-400" />
                    <span>Copy text</span>
                </button>
                <button type="button" @click="() => { handleReply(); showMenu = false; }"
                    class="w-full px-3 py-1.5 text-[10.5px] font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center space-x-2 transition focus:outline-none">
                    <CornerUpLeft class="h-3.5 w-3.5 text-zinc-400" />
                    <span>Reply</span>
                </button>
                <button type="button" @click="() => { emit('forward', message); showMenu = false; }"
                    class="w-full px-3 py-1.5 text-[10.5px] font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center space-x-2 transition focus:outline-none">
                    <Forward class="h-3.5 w-3.5 text-zinc-400" />
                    <span>Forward</span>
                </button>
                <div class="h-px bg-zinc-100 my-1"></div>
                <button type="button" @click="() => { startEdit(); showMenu = false; }"
                    class="w-full px-3 py-1.5 text-[10.5px] font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center space-x-2 transition focus:outline-none">
                    <Edit2 class="h-3.5 w-3.5 text-zinc-400" />
                    <span>Edit</span>
                </button>
                <button type="button" @click="() => { handleDelete(); showMenu = false; }"
                    class="w-full px-3 py-1.5 text-[10.5px] font-semibold text-red-600 hover:bg-red-50 flex items-center space-x-2 transition focus:outline-none">
                    <Trash2 class="h-3.5 w-3.5 text-red-400" />
                    <span>Delete</span>
                </button>
            </div>
        </div>

        <div :class="isEditing ? 'w-full' : 'w-fit'" class="max-w-[75%] sm:max-w-md md:max-w-lg">
            <div v-if="isEditing"
                class="flex w-full items-center space-x-1.5 bg-white rounded-lg border border-zinc-200 p-1.5 shadow-sm">
                <textarea v-model="localEditBody" dir="auto" rows="1" :disabled="isSaving"
                    class="flex-1 text-xs text-zinc-800 bg-transparent px-1.5 focus:outline-none resize-none min-h-[32px] overflow-y-auto"
                    @input="adjustTextareaHeight" @keydown.enter.exact.prevent="handleSave"
                    @keydown.esc="cancelEdit"></textarea>
                <button @click="handleSave" :disabled="isSaving"
                    class="inline-flex h-6 w-6 items-center justify-center rounded bg-blue-50 text-blue-600 transition hover:bg-blue-100 focus:outline-none disabled:opacity-50">
                    <Check class="h-3.5 w-3.5" />
                </button>
                <button @click="cancelEdit" :disabled="isSaving"
                    class="inline-flex h-6 w-6 items-center justify-center rounded bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 focus:outline-none disabled:opacity-50">
                    <X class="h-3.5 w-3.5" />
                </button>
            </div>

            <div v-else :class="message.sender_id === currentUser?.id ? 'bubble-sent' : 'bubble-received'">
                <!-- Forwarded Label -->
                <div v-if="message.is_forwarded" 
                    class="flex items-center space-x-1 text-[9px] font-semibold opacity-60 mb-1"
                    :class="message.sender_id === currentUser?.id ? 'text-zinc-300 justify-end' : 'text-zinc-400 justify-start'">
                    <Forward class="h-3 w-3" />
                    <span>Forwarded</span>
                </div>

                <!-- Reply Quote Banner -->
                <div v-if="message.parent" @click="scrollToMessage(message.parent.id)"
                    class="mb-1.5 p-2 rounded-lg cursor-pointer text-left select-none transition border-l-2"
                    :class="message.sender_id === currentUser?.id 
                        ? 'bg-white/15 border-l-white hover:bg-white/20' 
                        : 'bg-zinc-100/60 border-l-blue-600/80 hover:bg-zinc-200/50'">
                    <p class="text-[9px] font-bold leading-tight"
                        :class="message.sender_id === currentUser?.id ? 'text-white' : 'text-blue-600'">
                        {{ message.parent.sender_id === currentUser?.id ? 'You' : (selectedUser?.name || 'User') }}
                    </p>
                    <p class="text-[10px] truncate mt-0.5 max-w-[200px] sm:max-w-xs"
                        :class="message.sender_id === currentUser?.id ? 'text-zinc-200' : 'text-zinc-500'">
                        <span v-if="message.parent.is_audio" class="italic">🎤 Voice note</span>
                        <span v-else-if="message.parent.file_path && message.parent.file_type?.startsWith('image/')" class="italic">📷 Photo</span>
                        <span v-else-if="message.parent.file_path" class="italic">📁 File</span>
                        <span v-else>{{ message.parent.body }}</span>
                    </p>
                </div>

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
                        class="flex items-center space-x-1 text-[10px] font-semibold transition hover:underline mt-1.5"
                        :class="message.sender_id === currentUser?.id ? 'text-zinc-300 hover:text-white justify-end' : 'text-blue-600 hover:text-blue-700 justify-start'">
                        <Download class="h-3 w-3" />
                        <span>Download</span>
                    </a>
                </div>

                <div v-else-if="message.file_url" class="mt-2">
                    <a :href="message.file_url" :download="message.file_name" class="attachment-card"
                        :class="{ 'attachment-card-sent text-white border-zinc-700': message.sender_id === currentUser?.id }">
                        <div class="attachment-icon-wrapper"
                            :class="{ 'attachment-icon-wrapper-sent': message.sender_id === currentUser?.id }">
                            <FileText class="h-4.5 w-4.5" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-[11px] font-semibold truncate">{{ message.file_name }}
                            </p>
                            <p class="text-[9px] opacity-70 mt-0.5">{{
                                formatFileSize(message.file_size) }}</p>
                        </div>
                        <Download class="h-3.5 w-3.5 shrink-0 opacity-70 hover:opacity-100 transition" />
                    </a>
                </div>

                <div class="flex items-center mt-1 space-x-1 select-none font-medium opacity-70 text-[9px]"
                    :class="message.sender_id === currentUser?.id ? 'text-zinc-400 justify-end' : 'text-zinc-400 justify-start'">
                    <span>
                        {{ formatMessageTime(message.created_at) }}
                    </span>
                    <template v-if="message.sender_id === currentUser?.id">
                        <CheckCheck v-if="message.read_at" class="h-3.5 w-3.5 text-emerald-400" />
                        <Check v-else class="h-3.5 w-3.5 opacity-55" />
                    </template>
                </div>
            </div>
        </div>

        <!-- Actions for received messages (3 dots menu) -->
        <div v-if="message.sender_id !== currentUser?.id && !isEditing" 
            class="message-actions-wrapper relative shrink-0"
            :class="{ 'opacity-100': showMenu }">
            <button type="button" @click.stop="toggleMenu" 
                class="message-action-btn"
                :class="{ 'text-zinc-600 border-zinc-300 bg-zinc-50': showMenu }"
                title="More Actions">
                <MoreHorizontal class="h-3.5 w-3.5" />
            </button>

            <!-- Dropdown Menu -->
            <div v-if="showMenu" ref="menuRef" 
                class="absolute bottom-full mb-1.5 z-30 w-32 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 animate-in fade-in duration-100 text-left left-0">
                <button v-if="message.body" type="button" @click="handleCopy"
                    class="w-full px-3 py-1.5 text-[10.5px] font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center space-x-2 transition focus:outline-none">
                    <Copy class="h-3.5 w-3.5 text-zinc-400" />
                    <span>Copy text</span>
                </button>
                <button type="button" @click="() => { handleReply(); showMenu = false; }"
                    class="w-full px-3 py-1.5 text-[10.5px] font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center space-x-2 transition focus:outline-none">
                    <CornerUpLeft class="h-3.5 w-3.5 text-zinc-400" />
                    <span>Reply</span>
                </button>
                <button type="button" @click="() => { emit('forward', message); showMenu = false; }"
                    class="w-full px-3 py-1.5 text-[10.5px] font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center space-x-2 transition focus:outline-none">
                    <Forward class="h-3.5 w-3.5 text-zinc-400" />
                    <span>Forward</span>
                </button>
            </div>
        </div>
    </div>
</template>
