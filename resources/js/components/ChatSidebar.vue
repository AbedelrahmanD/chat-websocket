<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { LogOut, MessageSquare, Search, Bell, BellOff } from '@lucide/vue';
import axios from 'axios';
import { useUsers } from '@/composables/useUsers';
import { useMessages } from '@/composables/useMessages';
import { getInitials, formatMessageTime } from '@/lib/utils';
import ProfileModal from '@/components/ProfileModal.vue';
import { usePushNotifications } from '@/composables/usePushNotifications';

const showProfileModal = ref(false);

const {
    usersList,
    currentUser,
    selectedUser,
    onlineUsers,
    unreadCounts,
    logout
} = useUsers();

const { isSupported, isSubscribed, checkSubscription, subscribe, unsubscribe } = usePushNotifications();

let pingInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
    checkSubscription();
    const sendPing = (): void => {
        axios.post('/chat/ping').catch(() => {});
    };
    sendPing();
    pingInterval = setInterval(sendPing, 20000);
});

onUnmounted(() => {
    if (pingInterval) {
        clearInterval(pingInterval);
    }
});

const togglePush = async (): Promise<void> => {
    if (isSubscribed.value) {
        await unsubscribe();
    } else {
        await subscribe();
    }
};

const { selectUser } = useMessages();

const searchQuery = ref('');

const filteredUsers = computed(() => {
    const list = [...usersList.value].filter(user =>
        user.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );

    return list.sort((a, b) => {
        const isOnlineA = onlineUsers.value.includes(Number(a.id));
        const isOnlineB = onlineUsers.value.includes(Number(b.id));

        if (isOnlineA && !isOnlineB) return -1;
        if (!isOnlineA && isOnlineB) return 1;

        const timeA = a.latest_message ? new Date(a.latest_message.created_at).getTime() : 0;
        const timeB = b.latest_message ? new Date(b.latest_message.created_at).getTime() : 0;

        if (timeA !== timeB) {
            return timeB - timeA;
        }

        return a.name.localeCompare(b.name);
    });
});
</script>

<template>
    <aside class="sidebar-container" :class="selectedUser ? 'hidden sm:flex' : 'flex'">
        <div class="flex h-16 items-center justify-between border-b border-slate-200/60 px-4">
            <div class="flex items-center space-x-2">
                <div class="h-9 w-9 rounded-xl overflow-hidden shadow-md shadow-indigo-500/10">
                    <img src="/pwa-192x192.png" alt="Logo" class="h-full w-full object-cover" />
                </div>
                <span
                    class="text-md font-bold tracking-tight bg-gradient-to-r from-slate-950 to-slate-700 bg-clip-text text-transparent">
                    ChatApp
                </span>
            </div>

            <div class="flex items-center space-x-1.5">
                <button v-if="isSupported" @click="togglePush"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/60 bg-white transition focus:outline-none cursor-pointer"
                    :class="isSubscribed ? 'text-violet-600 hover:bg-violet-50 hover:border-violet-200 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'"
                    :title="isSubscribed ? 'Disable Push Notifications' : 'Enable Push Notifications'">
                    <Bell v-if="isSubscribed" class="h-4 w-4 fill-violet-600/10" />
                    <BellOff v-else class="h-4 w-4" />
                </button>

                <button @click="logout"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/60 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition focus:outline-none cursor-pointer"
                    title="Logout">
                    <LogOut class="h-4 w-4" />
                </button>
            </div>
        </div>

        <div @click="showProfileModal = true" class="flex items-center space-x-3 border-b border-slate-200/40 bg-slate-50/50 p-4 hover:bg-zinc-100/50 cursor-pointer transition select-none">
            <div class="avatar-circle avatar-indigo relative group">
                <img v-if="currentUser?.avatar_url" :src="currentUser.avatar_url" class="h-full w-full object-cover rounded-xl" />
                <span v-else>{{ currentUser ? getInitials(currentUser.name) : 'U' }}</span>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-700 truncate">{{ currentUser?.name }}</p>
                <p class="text-[10px] text-slate-400 truncate">{{ currentUser?.email }}</p>
            </div>
        </div>

        <div class="p-3 border-b border-slate-200/40">
            <div class="search-input-wrapper">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search class="h-4 w-4 text-slate-400" />
                </div>
                <input v-model="searchQuery" type="text" placeholder="Search conversations..." class="search-input" />
            </div>
        </div>

        <div class="user-list">
            <div v-for="user in filteredUsers" :key="user.id" @click="selectUser(user)" class="sidebar-item"
                :class="{ 'sidebar-item-active': Number(selectedUser?.id) === Number(user.id) }">
                <div class="avatar-circle"
                    :class="Number(selectedUser?.id) === Number(user.id) ? 'avatar-active' : 'avatar-indigo'">
                    <img v-if="user.avatar_url" :src="user.avatar_url" class="h-full w-full object-cover rounded-xl" />
                    <span v-else>{{ getInitials(user.name) }}</span>
                    <div class="online-dot" :class="onlineUsers.includes(Number(user.id)) ? 'bg-emerald-500' : 'bg-zinc-300'">
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xs font-semibold truncate"
                            :class="Number(selectedUser?.id) === Number(user.id) ? 'text-zinc-950' : 'text-zinc-800'">
                            {{ user.name }}
                        </h3>
                        <div class="flex items-center space-x-1 shrink-0">
                            <span v-if="user.latest_message" class="text-[8px] text-zinc-400 font-medium">
                                {{ formatMessageTime(user.latest_message.created_at) }}
                            </span>
                            <span v-if="unreadCounts[user.id] > 0"
                                class="inline-flex h-4 min-w-4 items-center justify-center rounded-md bg-blue-600 px-1 text-[8px] font-bold text-white shadow-xs">
                                {{ unreadCounts[user.id] }}
                            </span>
                        </div>
                    </div>
                    <p class="text-[10px] text-zinc-400 truncate mt-0.5 leading-tight">
                        <template v-if="user.latest_message">
                            <span v-if="Number(user.latest_message.sender_id) === Number(currentUser?.id)" class="text-zinc-500 font-medium">You: </span>
                            <span v-if="user.latest_message.is_audio" class="italic">
                                🎤 Voice note
                            </span>
                            <span v-else-if="user.latest_message.file_path && user.latest_message.file_type?.startsWith('image/')" class="italic">
                                📷 Photo
                            </span>
                            <span v-else-if="user.latest_message.file_path" class="italic">
                                📁 File
                            </span>
                            <span v-else>{{ user.latest_message.body }}</span>
                        </template>
                        <template v-else>
                            No messages yet
                        </template>
                    </p>
                </div>
            </div>

            <div v-if="filteredUsers.length === 0" class="p-6 text-center text-xs text-slate-400">
                No users found
            </div>
        </div>
    </aside>

    <ProfileModal v-if="showProfileModal && currentUser" :user="currentUser" @close="showProfileModal = false" />
</template>
