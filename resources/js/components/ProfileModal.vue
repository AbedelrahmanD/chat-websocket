<script setup lang="ts">
import { ref } from 'vue';
import { useForm } from '@inertiajs/vue3';
import { X, Camera, Loader2, User, Mail, Lock } from '@lucide/vue';
import type { User as UserType } from '@/types/auth';
import { getInitials } from '@/lib/utils';
import { route } from 'ziggy-js';

const props = defineProps<{
    user: UserType;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
}>();

const avatarInput = ref<HTMLInputElement | null>(null);
const avatarPreview = ref<string | null>(props.user.avatar_url ?? null);

const form = useForm({
    name: props.user.name,
    email: props.user.email,
    password: '',
    password_confirmation: '',
    avatar: null as File | null,
});

const triggerAvatarSelect = () => {
    avatarInput.value?.click();
};

const handleAvatarChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        form.avatar = file;
        avatarPreview.value = URL.createObjectURL(file);
    }
};

const handleSubmit = () => {
    form.post(route('profile.update'), {
        onSuccess: () => {
            form.reset('password', 'password_confirmation');
            emit('close');
        },
    });
};
</script>

<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-200">
        <div class="w-full max-w-md bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-zinc-200/80 p-4">
                <h3 class="text-sm font-bold text-zinc-900">Edit Profile</h3>
                <button @click="emit('close')" type="button" class="text-zinc-400 hover:text-zinc-600 focus:outline-none transition">
                    <X class="h-4.5 w-4.5" />
                </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="p-5 space-y-4">
                <!-- Avatar Upload -->
                <div class="flex flex-col items-center justify-center space-y-2">
                    <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="handleAvatarChange" />
                    <div @click="triggerAvatarSelect" 
                        class="h-20 w-20 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer overflow-hidden relative group transition duration-200 shadow-sm flex items-center justify-center">
                        
                        <img v-if="avatarPreview" :src="avatarPreview" class="h-full w-full object-cover" />
                        <span v-else class="text-lg font-bold text-zinc-700">{{ getInitials(user.name) }}</span>

                        <div class="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-200 text-white select-none">
                            <Camera class="h-5 w-5" />
                            <span class="text-[9px] font-semibold mt-1">Upload</span>
                        </div>
                    </div>
                    <span class="text-[10px] text-zinc-400 font-medium">Click photo to update avatar</span>
                    <p v-if="form.errors.avatar" class="text-[10px] text-red-600 font-medium text-center">{{ form.errors.avatar }}</p>
                </div>

                <!-- Fields -->
                <div class="space-y-3">
                    <!-- Name -->
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Name</label>
                        <div class="relative">
                            <User class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <input v-model="form.name" type="text" required
                                class="w-full text-xs bg-zinc-50/30 border border-zinc-200 rounded-lg pl-9 pr-3 py-2.5 focus:border-zinc-300 focus:bg-white focus:outline-none placeholder-zinc-400" />
                        </div>
                        <p v-if="form.errors.name" class="text-[10px] text-red-600 font-medium">{{ form.errors.name }}</p>
                    </div>

                    <!-- Email -->
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email</label>
                        <div class="relative">
                            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <input v-model="form.email" type="email" required
                                class="w-full text-xs bg-zinc-50/30 border border-zinc-200 rounded-lg pl-9 pr-3 py-2.5 focus:border-zinc-300 focus:bg-white focus:outline-none placeholder-zinc-400" />
                        </div>
                        <p v-if="form.errors.email" class="text-[10px] text-red-600 font-medium">{{ form.errors.email }}</p>
                    </div>

                    <!-- Password -->
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">New Password (optional)</label>
                        <div class="relative">
                            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <input v-model="form.password" type="password" placeholder="Leave blank to keep current"
                                class="w-full text-xs bg-zinc-50/30 border border-zinc-200 rounded-lg pl-9 pr-3 py-2.5 focus:border-zinc-300 focus:bg-white focus:outline-none placeholder-zinc-400" />
                        </div>
                        <p v-if="form.errors.password" class="text-[10px] text-red-600 font-medium">{{ form.errors.password }}</p>
                    </div>

                    <!-- Confirm Password -->
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Confirm New Password</label>
                        <div class="relative">
                            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <input v-model="form.password_confirmation" type="password" placeholder="Confirm your new password"
                                class="w-full text-xs bg-zinc-50/30 border border-zinc-200 rounded-lg pl-9 pr-3 py-2.5 focus:border-zinc-300 focus:bg-white focus:outline-none placeholder-zinc-400" />
                        </div>
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-100">
                    <button type="button" @click="emit('close')" :disabled="form.processing"
                        class="inline-flex h-9 px-3.5 items-center justify-center rounded-lg border border-zinc-200 bg-white text-xs font-bold text-zinc-500 hover:bg-zinc-50 transition focus:outline-none disabled:opacity-50">
                        Cancel
                    </button>
                    <button type="submit" :disabled="form.processing"
                        class="inline-flex h-9 px-4 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition focus:outline-none disabled:opacity-50">
                        <span v-if="form.processing" class="flex items-center space-x-1.5">
                            <Loader2 class="h-3.5 w-3.5 animate-spin" />
                            <span>Saving</span>
                        </span>
                        <span v-else>Save Changes</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>
