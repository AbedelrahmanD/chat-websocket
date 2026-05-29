<script setup lang="ts">
import { ref } from 'vue';
import { ArrowLeft, Loader2, MessageSquare } from '@lucide/vue';
import { useUsers } from '@/composables/useUsers';
import { useMessages } from '@/composables/useMessages';
import MessageItem from '@/components/MessageItem.vue';
import ChatInput from '@/components/ChatInput.vue';
import ForwardModal from '@/components/ForwardModal.vue';
import { getInitials } from '@/lib/utils';
import type { Message } from '@/types/chat';

const { selectedUser, onlineUsers } = useUsers();
const {
    messages,
    isLoadingMessages,
    isLoadingMore,
    otherUserIsTyping,
    messageContainerRef,
    handleScroll,
    backToConversations
} = useMessages();

const forwardMessageData = ref<Message | null>(null);

const openForwardModal = (msg: Message) => {
    forwardMessageData.value = msg;
};

const closeForwardModal = () => {
    forwardMessageData.value = null;
};
</script>

<template>
    <main class="chat-area" :class="selectedUser ? 'flex' : 'hidden sm:flex'">
        <template v-if="selectedUser">
            <header class="chat-header">
                <div class="flex items-center space-x-3">
                    <button @click="backToConversations"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/60 bg-white text-slate-500 hover:bg-slate-50 sm:hidden transition focus:outline-none"
                        title="Back to conversations">
                        <ArrowLeft class="h-4 w-4" />
                    </button>
                    <div class="avatar-circle avatar-indigo">
                        <img v-if="selectedUser.avatar_url" :src="selectedUser.avatar_url" class="h-full w-full object-cover rounded-xl" />
                        <span v-else>{{ getInitials(selectedUser.name) }}</span>
                    </div>
                    <div>
                        <h2 class="text-xs font-bold text-zinc-900 leading-tight">{{ selectedUser.name }}</h2>
                        <p v-if="otherUserIsTyping"
                            class="text-[10px] text-blue-600 font-semibold flex items-center mt-0.5 animate-pulse">
                            {{ selectedUser.name }} is typing...
                        </p>
                        <p v-else-if="onlineUsers.includes(Number(selectedUser.id))"
                            class="text-[10px] text-emerald-600 font-semibold flex items-center mt-0.5">
                            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                            Active Now
                        </p>
                        <p v-else class="text-[10px] text-zinc-400 font-medium flex items-center mt-0.5">
                            <span class="h-1.5 w-1.5 rounded-full bg-zinc-300 mr-1.5"></span>
                            Offline
                        </p>
                    </div>
                </div>
            </header>

            <div ref="messageContainerRef" @scroll="handleScroll" class="flex-1 overflow-y-auto p-6">
                <div v-if="isLoadingMessages" class="flex h-full items-center justify-center">
                    <Loader2 class="h-8 w-8 animate-spin text-indigo-500" />
                </div>

                <template v-else>
                    <div v-if="isLoadingMore" class="flex justify-center mb-4">
                        <Loader2 class="h-5 w-5 animate-spin text-indigo-500" />
                    </div>

                    <div v-if="messages.length === 0"
                        class="flex h-full items-center justify-center text-slate-400 text-sm">
                        No messages yet. Send a message to start the conversation!
                    </div>

                    <div v-else class="space-y-4">
                        <MessageItem v-for="message in messages" :key="message.id" :message="message" @forward="openForwardModal" />
                    </div>
                </template>
            </div>

            <ChatInput />
        </template>

        <template v-else>
            <div class="flex flex-1 items-center justify-center">
                <div class="chat-welcome-container max-w-sm">
                    <div
                        class="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-xs mb-4">
                        <MessageSquare class="h-7 w-7" />
                    </div>
                    <h2 class="text-xl font-bold text-slate-900">Your Conversations</h2>
                    <p class="mt-2 text-sm text-slate-500">
                        Select a user from the sidebar to view your chat history and start messaging in real-time.
                    </p>
                </div>
            </div>
        </template>
        <ForwardModal v-if="forwardMessageData" :message="forwardMessageData" @close="closeForwardModal" />
    </main>
</template>
