<script setup lang="ts">
import { ArrowLeft, Loader2, MessageSquare } from '@lucide/vue';
import { useChat } from '@/composables/useChat';
import MessageItem from '@/components/MessageItem.vue';
import ChatInput from '@/components/ChatInput.vue';
import { getInitials } from '@/lib/utils';

const {
    selectedUser,
    messages,
    isLoadingMessages,
    isLoadingMore,
    otherUserIsTyping,
    onlineUsers,
    messageContainerRef,
    handleScroll,
    backToConversations
} = useChat();
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
                        {{ getInitials(selectedUser.name) }}
                    </div>
                    <div>
                        <h2 class="text-sm font-bold text-slate-900">{{ selectedUser.name }}</h2>
                        <p v-if="otherUserIsTyping"
                            class="text-xs text-indigo-600 font-semibold flex items-center mt-0.5 animate-pulse">
                            {{ selectedUser.name }} is typing...
                        </p>
                        <p v-else-if="onlineUsers.includes(selectedUser.id)"
                            class="text-xs text-emerald-600 font-semibold flex items-center mt-0.5">
                            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                            Active Now
                        </p>
                        <p v-else class="text-xs text-slate-400 font-medium flex items-center mt-0.5">
                            <span class="h-1.5 w-1.5 rounded-full bg-slate-300 mr-1.5"></span>
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
                        <MessageItem v-for="message in messages" :key="message.id" :message="message" />
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
    </main>
</template>
