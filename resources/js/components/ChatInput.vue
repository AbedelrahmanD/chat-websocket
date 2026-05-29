<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Paperclip, Mic, Send, X, FileText, Square, Smile } from '@lucide/vue';
import { useUsers } from '@/composables/useUsers';
import { useMessages } from '@/composables/useMessages';
import { formatDuration, formatFileSize } from '@/lib/utils';
import EmojiPicker from '@/components/EmojiPicker.vue';

const { selectedUser, currentUser } = useUsers();
const {
    sendMessageText,
    sendMessageFiles,
    sendMessageVoice,
    sendTypingNotification,
    isLoadingMessages,
    replyToMessage
} = useMessages();

const newMessageBody = ref('');
const selectedFiles = ref<File[]>([]);
const isRecording = ref(false);
const recordingTime = ref(0);
let recordingTimer: ReturnType<typeof setInterval> | null = null;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

const fileInput = ref<HTMLInputElement | null>(null);
const messageInput = ref<HTMLTextAreaElement | null>(null);
const showEmojiPicker = ref(false);

const handleEmojiSelect = (emoji: string) => {
    const textarea = messageInput.value;
    if (!textarea) {
        newMessageBody.value += emoji;
        focusInput();
        return;
    }

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const text = newMessageBody.value;

    newMessageBody.value = text.substring(0, startPos) + emoji + text.substring(endPos);

    nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = startPos + emoji.length;
        focusInput();
    });
};

const triggerFileSelect = () => {
    fileInput.value?.click();
};

const handleFileChange = (e: Event) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) {
        selectedFiles.value = Array.from(files);
    }
};

const cancelFile = () => {
    selectedFiles.value = [];
    if (fileInput.value) {
        fileInput.value.value = '';
    }
};

const handlePaste = (event: ClipboardEvent) => {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const files: File[] = [];
    for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
                files.push(file);
            }
        }
    }

    if (files.length > 0) {
        event.preventDefault();
        selectedFiles.value = [...selectedFiles.value, ...files];
    }
};

const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            if (recordingTime.value === 0) return;
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const parentId = replyToMessage.value?.id;
            sendMessageVoice(audioBlob, parentId);
            replyToMessage.value = null;
            stream.getTracks().forEach(track => track.stop());
            recordingTime.value = 0;
        };

        mediaRecorder.start();
        isRecording.value = true;
        recordingTime.value = 0;

        recordingTimer = setInterval(() => {
            recordingTime.value++;
        }, 1000);
    } catch (error) {
        alert('Could not access microphone. Please check permissions.');
        console.error(error);
    }
};

const stopRecording = () => {
    if (mediaRecorder && isRecording.value) {
        mediaRecorder.stop();
        isRecording.value = false;
        if (recordingTimer) {
            clearInterval(recordingTimer);
            recordingTimer = null;
        }
    }
};

const cancelRecording = () => {
    if (mediaRecorder && isRecording.value) {
        recordingTime.value = 0;
        mediaRecorder.stop();
        isRecording.value = false;
        if (recordingTimer) {
            clearInterval(recordingTimer);
            recordingTimer = null;
        }
    }
};

const isTypingLocal = ref(false);
let typingTimeoutLocal: ReturnType<typeof setTimeout> | null = null;

const handleTyping = () => {
    if (!isTypingLocal.value) {
        isTypingLocal.value = true;
        sendTypingNotification(true);
    }

    if (typingTimeoutLocal) clearTimeout(typingTimeoutLocal);

    typingTimeoutLocal = setTimeout(() => {
        isTypingLocal.value = false;
        sendTypingNotification(false);
    }, 3000);
};

const adjustTextareaHeight = (event: Event) => {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
};

const handleInput = (event: Event) => {
    handleTyping();
    adjustTextareaHeight(event);
};

const handleSubmit = () => {
    const body = newMessageBody.value.trim();
    const files = selectedFiles.value;

    if (!body && files.length === 0) return;

    const parentId = replyToMessage.value?.id;

    if (files.length > 0) {
        sendMessageFiles(files, body, parentId);
    } else {
        sendMessageText(body, parentId);
    }

    newMessageBody.value = '';
    cancelFile();
    replyToMessage.value = null;
    if (messageInput.value) {
        messageInput.value.style.height = 'auto';
    }

    if (typingTimeoutLocal) {
        clearTimeout(typingTimeoutLocal);
        typingTimeoutLocal = null;
    }
    isTypingLocal.value = false;
    sendTypingNotification(false);
};

const focusInput = () => {
    nextTick(() => {
        messageInput.value?.focus();
    });
    setTimeout(() => {
        messageInput.value?.focus();
    }, 50);
    setTimeout(() => {
        messageInput.value?.focus();
    }, 150);
};

watch(selectedUser, () => {
    newMessageBody.value = '';
    cancelFile();
    cancelRecording();
    showEmojiPicker.value = false;
    focusInput();
});

watch(isLoadingMessages, (loading) => {
    if (!loading) {
        focusInput();
    }
});

onMounted(() => {
    focusInput();
});

onUnmounted(() => {
    if (recordingTimer) clearInterval(recordingTimer);
    if (typingTimeoutLocal) clearTimeout(typingTimeoutLocal);
});
</script>

<template>
    <footer class="border-t border-zinc-200/80 bg-white p-4">
        <div v-if="isRecording" class="recording-container">
            <span class="recording-dot"></span>
            <span class="text-xs font-semibold flex-1">Recording ({{ formatDuration(recordingTime) }})</span>
            <button type="button" @click="cancelRecording"
                class="inline-flex h-8 px-2.5 items-center justify-center rounded-lg border border-red-200 text-[10px] font-bold text-red-600 bg-white hover:bg-red-50 transition focus:outline-none">
                Cancel
            </button>
            <button type="button" @click="stopRecording"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-700 transition focus:outline-none animate-pulse">
                <Square class="h-3.5 w-3.5" />
            </button>
        </div>

        <div v-else>
            <!-- Reply Preview Banner -->
            <div v-if="replyToMessage" 
                class="flex items-center justify-between bg-zinc-50 border border-zinc-200 p-3 rounded-t-lg border-b-0 transition animate-in slide-in-from-bottom-2 duration-150">
                <div class="border-l-2 border-blue-600/80 pl-3 text-left min-w-0">
                    <p class="text-[10px] font-bold text-blue-600 leading-tight">
                        Replying to {{ replyToMessage.sender_id === currentUser?.id ? 'yourself' : selectedUser?.name }}
                    </p>
                    <p class="text-[11.5px] text-zinc-500 truncate mt-0.5 max-w-[280px] sm:max-w-md">
                        <span v-if="replyToMessage.is_audio" class="italic">🎤 Voice note</span>
                        <span v-else-if="replyToMessage.file_path && replyToMessage.file_type?.startsWith('image/')" class="italic">📷 Photo</span>
                        <span v-else-if="replyToMessage.file_path" class="italic">📁 File</span>
                        <span v-else>{{ replyToMessage.body }}</span>
                    </p>
                </div>
                <button type="button" @click="replyToMessage = null" class="text-zinc-400 hover:text-zinc-600 transition focus:outline-none shrink-0 ml-4">
                    <X class="h-4 w-4" />
                </button>
            </div>

            <div v-if="selectedFiles.length > 0"
                class="flex flex-col space-y-1.5 bg-zinc-50 border border-zinc-200 p-3"
                :class="replyToMessage ? 'border-t-0 border-b-0' : 'rounded-t-lg border-b-0'">
                <div v-for="(file, idx) in selectedFiles" :key="idx" class="flex items-center justify-between">
                    <div class="flex items-center space-x-2 text-zinc-600">
                        <FileText class="h-3.5 w-3.5 text-blue-600" />
                        <span class="text-[11px] font-semibold truncate max-w-xs">{{ file.name }} ({{ formatFileSize(file.size) }})</span>
                    </div>
                    <button type="button" @click="() => { selectedFiles.splice(idx, 1); }"
                        class="text-zinc-400 hover:text-zinc-600 focus:outline-none">
                        <X class="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            <form @submit.prevent="handleSubmit" class="flex items-center space-x-2.5">
                <input ref="fileInput" type="file" multiple class="hidden" @change="handleFileChange" />
                <button type="button" @click="triggerFileSelect"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition focus:outline-none shadow-xs"
                    title="Attach Files">
                    <Paperclip class="h-4 w-4" />
                </button>

                <textarea ref="messageInput" autofocus v-model="newMessageBody" dir="auto"
                    placeholder="Type a message..." @input="handleInput" @paste="handlePaste"
                    @keydown.enter.exact.prevent="handleSubmit" rows="1"
                    class="block w-full border border-zinc-200 bg-zinc-50/30 py-2.5 px-3.5 text-[13px] text-zinc-800 placeholder-zinc-400 focus:border-zinc-300 focus:bg-white focus:outline-none resize-none min-h-[40px] max-h-[120px] overflow-y-auto transition-all"
                    :class="(selectedFiles.length > 0 || replyToMessage) ? 'rounded-b-lg border-t-0' : 'rounded-lg'"></textarea>

                <div class="relative shrink-0 flex items-center">
                    <button type="button" @click.stop="showEmojiPicker = !showEmojiPicker"
                        class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition focus:outline-none shadow-xs"
                        :class="{ 'text-blue-600 border-blue-200 bg-blue-50/20': showEmojiPicker }"
                        title="Add Emoji">
                        <Smile class="h-4.5 w-4.5" />
                    </button>
                    <EmojiPicker v-if="showEmojiPicker" @select="handleEmojiSelect" @close="showEmojiPicker = false" />
                </div>

                <button type="button" @click="startRecording"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-blue-50/50 hover:text-blue-600 hover:border-blue-200 transition focus:outline-none shadow-xs"
                    title="Record Audio">
                    <Mic class="h-4 w-4" />
                </button>

                <button type="submit" :disabled="!newMessageBody.trim() && selectedFiles.length === 0"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                    <Send class="h-3.5 w-3.5" />
                </button>
            </form>
        </div>
    </footer>
</template>
