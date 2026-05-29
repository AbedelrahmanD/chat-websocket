<script setup lang="ts">
import { ref, onUnmounted, watch } from 'vue';
import { Paperclip, Mic, Send, X, FileText, Square } from '@lucide/vue';
import { useChat } from '@/composables/useChat';
import { formatDuration, formatFileSize } from '@/lib/utils';

const {
    selectedUser,
    sendMessageText,
    sendMessageFiles,
    sendMessageVoice,
    sendTypingNotification
} = useChat();

const newMessageBody = ref('');
const selectedFiles = ref<File[]>([]);
const isRecording = ref(false);
const recordingTime = ref(0);
let recordingTimer: ReturnType<typeof setInterval> | null = null;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

const fileInput = ref<HTMLInputElement | null>(null);
const messageInput = ref<HTMLTextAreaElement | null>(null);

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
            sendMessageVoice(audioBlob);
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

    if (files.length > 0) {
        sendMessageFiles(files, body);
    } else {
        sendMessageText(body);
    }

    newMessageBody.value = '';
    cancelFile();
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

watch(selectedUser, () => {
    newMessageBody.value = '';
    cancelFile();
    cancelRecording();
});

onUnmounted(() => {
    if (recordingTimer) clearInterval(recordingTimer);
    if (typingTimeoutLocal) clearTimeout(typingTimeoutLocal);
});
</script>

<template>
    <footer class="border-t border-slate-200/60 bg-white p-4">
        <div v-if="isRecording" class="recording-container">
            <span class="recording-dot"></span>
            <span class="text-sm font-semibold flex-1">Recording ({{ formatDuration(recordingTime) }})</span>
            <button type="button" @click="cancelRecording"
                class="inline-flex h-9 px-3 items-center justify-center rounded-lg border border-red-200 text-xs font-bold text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition focus:outline-none">
                Cancel
            </button>
            <button type="button" @click="stopRecording"
                class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white shadow-md shadow-red-500/20 hover:bg-red-500 transition focus:outline-none animate-pulse">
                <Square class="h-4 w-4" />
            </button>
        </div>

        <div v-else>
            <div v-if="selectedFiles.length > 0"
                class="flex flex-col space-y-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-t-xl">
                <div v-for="(file, idx) in selectedFiles" :key="idx" class="flex items-center justify-between">
                    <div class="flex items-center space-x-2 text-slate-600">
                        <FileText class="h-4 w-4 text-indigo-500" />
                        <span class="text-xs font-semibold truncate max-w-xs">{{ file.name }} ({{ formatFileSize(file.size) }})</span>
                    </div>
                    <button type="button" @click="() => { selectedFiles.splice(idx, 1); }"
                        class="text-slate-400 hover:text-slate-600 focus:outline-none">
                        <X class="h-4 w-4" />
                    </button>
                </div>
            </div>

            <form @submit.prevent="handleSubmit" class="flex items-center space-x-3">
                <input ref="fileInput" type="file" multiple class="hidden" @change="handleFileChange" />
                <button type="button" @click="triggerFileSelect"
                    class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition focus:outline-none shadow-xs"
                    title="Attach Files">
                    <Paperclip class="h-4.5 w-4.5" />
                </button>

                <textarea ref="messageInput" v-model="newMessageBody" dir="auto"
                    placeholder="Type a message..." @input="handleInput"
                    @keydown.enter.exact.prevent="handleSubmit" rows="1"
                    class="block w-full border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/5 focus:outline-none resize-none min-h-[44px] max-h-[120px] overflow-y-auto"
                    :class="selectedFiles.length > 0 ? 'rounded-b-xl border-t-0' : 'rounded-xl'"></textarea>

                <button type="button" @click="startRecording"
                    class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition focus:outline-none shadow-xs"
                    title="Record Audio">
                    <Mic class="h-4.5 w-4.5" />
                </button>

                <button type="submit" :disabled="!newMessageBody.trim() && selectedFiles.length === 0"
                    class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                    <Send class="h-4 w-4" />
                </button>
            </form>
        </div>
    </footer>
</template>
