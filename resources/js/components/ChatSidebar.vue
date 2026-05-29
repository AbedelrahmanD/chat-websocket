<script setup lang="ts">
import { ref, computed } from 'vue';
import { LogOut, MessageSquare, Search } from '@lucide/vue';
import { useChat } from '@/composables/useChat';
import { getInitials } from '@/lib/utils';

const {
    usersList,
    currentUser,
    selectedUser,
    onlineUsers,
    unreadCounts,
    selectUser,
    logout
} = useChat();

const searchQuery = ref('');

const filteredUsers = computed(() => {
    return usersList.value.filter(user =>
        user.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});
</script>

<template>
    <aside class="sidebar-container" :class="selectedUser ? 'hidden sm:flex' : 'flex'">
        <div class="flex h-16 items-center justify-between border-b border-slate-200/60 px-4">
            <div class="flex items-center space-x-2">
                <div
                    class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-indigo-500/10">
                    <MessageSquare class="h-4.5 w-4.5 text-white" />
                </div>
                <span
                    class="text-md font-bold tracking-tight bg-gradient-to-r from-slate-950 to-slate-700 bg-clip-text text-transparent">
                    ChatApp
                </span>
            </div>

            <button @click="logout"
                class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/60 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition focus:outline-none"
                title="Logout">
                <LogOut class="h-4 w-4" />
            </button>
        </div>

        <div class="flex items-center space-x-3 border-b border-slate-200/40 bg-slate-50/50 p-4">
            <div class="avatar-circle avatar-indigo">
                {{ currentUser ? getInitials(currentUser.name) : 'U' }}
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-700 truncate">{{ currentUser?.name }}</p>
                <p class="text-xs text-slate-400 truncate">{{ currentUser?.email }}</p>
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
                :class="{ 'sidebar-item-active': selectedUser?.id === user.id }">
                <div class="avatar-circle"
                    :class="selectedUser?.id === user.id ? 'avatar-active bg-indigo-600' : 'avatar-indigo'">
                    {{ getInitials(user.name) }}
                    <div class="online-dot" :class="onlineUsers.includes(user.id) ? 'bg-emerald-500' : 'bg-slate-300'">
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-semibold truncate"
                            :class="selectedUser?.id === user.id ? 'text-indigo-900' : 'text-slate-800'">
                            {{ user.name }}
                        </h3>
                        <span v-if="unreadCounts[user.id] > 0"
                            class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white shadow-sm">
                            {{ unreadCounts[user.id] }}
                        </span>
                    </div>
                    <p class="text-xs text-slate-400 truncate mt-0.5">Click to open chat history</p>
                </div>
            </div>

            <div v-if="filteredUsers.length === 0" class="p-6 text-center text-xs text-slate-400">
                No users found
            </div>
        </div>
    </aside>
</template>
