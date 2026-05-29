<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { Head, usePage } from '@inertiajs/vue3';
import type { SharedPageProps } from '@/types/global';
import type { User } from '@/types/auth';
import { useChat } from '@/composables/useChat';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';

import ChatSidebar from '@/components/ChatSidebar.vue';
import ChatWindow from '@/components/ChatWindow.vue';

const props = defineProps<{
    users: User[];
}>();

const page = usePage<SharedPageProps>();

const { init, cleanup } = useChat();

onMounted(() => {
    init(props.users, page.props.auth.user);
    Fancybox.bind('[data-fancybox="gallery"]', {
        Hash: false,
    });
});

onUnmounted(() => {
    cleanup();
    Fancybox.destroy();
});
</script>

<template>

    <Head title="Chat" />

    <div class="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-800">
        <ChatSidebar />
        <ChatWindow />
    </div>
</template>
