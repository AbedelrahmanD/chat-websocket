<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, Search, Check, Send, Loader2 } from '@lucide/vue';
import { useUsers } from '@/composables/useUsers';
import { useMessages } from '@/composables/useMessages';
import { getInitials } from '@/lib/utils';
import type { Message } from '@/types/chat';

const props = defineProps<{
    message: Message;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
}>();

const { usersList, currentUser } = useUsers();
const { forwardMessage } = useMessages();

const searchQuery = ref('');
const sendingIds = ref<number[]>([]);
const sentIds = ref<number[]>([]);

const filteredUsers = computed(() => {
    return usersList.value.filter(user => 
        user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
        Number(user.id) !== Number(currentUser.value?.id)
    );
});

const handleForward = async (userId: number) => {
    if (sendingIds.value.includes(userId) || sentIds.value.includes(userId)) return;

    sendingIds.value.push(userId);
    try {
        await forwardMessage(props.message, userId);
        sentIds.value.push(userId);
    } catch (error) {
        console.error('Error forwarding message:', error);
    } finally {
        sendingIds.value = sendingIds.value.filter(id => id !== userId);
    }
};
</script>

<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-200">
        <div class="w-full max-w-md bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-zinc-200/80 p-4">
                <h3 class="text-sm font-bold text-zinc-900">Forward Message</h3>
                <button @click="emit('close')" class="text-zinc-400 hover:text-zinc-600 focus:outline-none transition">
                    <X class="h-4.5 w-4.5" />
                </button>
            </div>

            <!-- Search -->
            <div class="p-3 border-b border-zinc-200/50 bg-zinc-50/50">
                <div class="relative">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search contacts..."
                        class="w-full text-xs bg-white border border-zinc-200 rounded-lg pl-9 pr-3 py-2 focus:border-zinc-300 focus:outline-none placeholder-zinc-400"
                    />
                </div>
            </div>

            <!-- User List -->
            <div class="flex-1 overflow-y-auto p-2 min-h-[250px] max-h-[400px]">
                <div v-if="filteredUsers.length === 0" class="flex flex-col items-center justify-center py-12 text-zinc-400 text-xs">
                    No contacts found
                </div>
                <div v-else class="space-y-1">
                    <div
                        v-for="user in filteredUsers"
                        :key="user.id"
                        class="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 transition"
                    >
                        <div class="flex items-center space-x-3 min-w-0">
                            <div class="avatar-circle avatar-indigo shrink-0">
                                <img v-if="user.avatar_url" :src="user.avatar_url" class="h-full w-full object-cover rounded-xl" />
                                <span v-else>{{ getInitials(user.name) }}</span>
                            </div>
                            <div class="min-w-0">
                                <h4 class="text-xs font-semibold text-zinc-800 truncate">{{ user.name }}</h4>
                                <p class="text-[10px] text-zinc-400 truncate">{{ user.email }}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            @click="handleForward(user.id)"
                            :disabled="sendingIds.includes(user.id)"
                            class="inline-flex h-8 px-3 items-center justify-center rounded-lg border text-[11px] font-bold transition focus:outline-none"
                            :class="sentIds.includes(user.id)
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 cursor-default'
                                : 'bg-blue-600 border-transparent text-white hover:bg-blue-700 disabled:opacity-50'"
                        >
                            <span v-if="sendingIds.includes(user.id)" class="flex items-center space-x-1">
                                <Loader2 class="h-3 w-3 animate-spin" />
                                <span>Sending</span>
                            </span>
                            <span v-else-if="sentIds.includes(user.id)" class="flex items-center space-x-1">
                                <Check class="h-3 w-3" />
                                <span>Sent</span>
                            </span>
                            <span v-else class="flex items-center space-x-1">
                                <Send class="h-3 w-3 mr-1" />
                                <span>Send</span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
