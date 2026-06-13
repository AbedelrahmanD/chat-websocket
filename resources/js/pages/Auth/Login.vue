<script setup lang="ts">
import { ref } from 'vue';
import { useForm, Head, Link } from '@inertiajs/vue3';
import { Eye, EyeOff, Lock, Mail, Loader2 } from '@lucide/vue';

const showPassword = ref(false);

const form = useForm({
    email: '',
    password: '',
    remember: false,
});

const submit = (): void => {
    form.post('/login', {
        onFinish: () => {
            form.reset('password');
        },
    });
};
</script>

<template>
    <Head title="Sign In" />

    <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4 sm:p-6">
        <!-- Animated Background Blobs -->
        <div class="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-500/10 blur-[120px] animate-pulse"></div>
        <div class="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px] animate-pulse duration-4000"></div>

        <!-- Login Container -->
        <div class="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl sm:p-10 animate-fade-in">
            <!-- Header -->
            <div class="mb-8 text-center">
                <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/25">
                    <img src="/pwa-192x192.png" alt="App Logo" class="h-full w-full object-cover" />
                </div>
                <h1 class="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome Back</h1>
                <p class="mt-2 text-sm text-slate-500">Sign in to your account to start chatting</p>
            </div>

            <!-- Login Form -->
            <form @submit.prevent="submit" class="space-y-6">
                <!-- Email Field -->
                <div class="form-group">
                    <label for="email" class="form-label">Email Address</label>
                    <div class="form-input-wrapper">
                        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Mail class="form-icon" />
                        </div>
                        <input
                            id="email"
                            v-model="form.email"
                            type="email"
                            required
                            autocomplete="username"
                            placeholder="you@example.com"
                            class="form-input"
                            :class="{ 'form-input-error': form.errors.email }"
                        />
                    </div>
                    <span v-if="form.errors.email" class="form-error">{{ form.errors.email }}</span>
                </div>

                <!-- Password Field -->
                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <div class="form-input-wrapper">
                        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Lock class="form-icon" />
                        </div>
                        <input
                            id="password"
                            v-model="form.password"
                            :type="showPassword ? 'text' : 'password'"
                            required
                            autocomplete="current-password"
                            placeholder="••••••••"
                            class="form-input"
                            :class="{ 'form-input-error': form.errors.password }"
                        />
                        <button
                            type="button"
                            @click="showPassword = !showPassword"
                            class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            <EyeOff v-if="showPassword" class="h-5 w-5" />
                            <Eye v-else class="h-5 w-5" />
                        </button>
                    </div>
                    <span v-if="form.errors.password" class="form-error">{{ form.errors.password }}</span>
                </div>

                <!-- Remember Me -->
                <div class="flex items-center justify-between">
                    <label class="flex items-center space-x-2.5 cursor-pointer">
                        <input
                            type="checkbox"
                            v-model="form.remember"
                            class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                        />
                        <span class="text-xs text-slate-500 hover:text-slate-700 transition duration-150">Remember me</span>
                    </label>
                </div>

                <!-- Submit Button -->
                <button
                    type="submit"
                    :disabled="form.processing"
                    class="relative flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition duration-200 hover:from-violet-500 hover:to-indigo-500 hover:shadow-indigo-500/35 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                >
                    <Loader2 v-if="form.processing" class="mr-2 h-4 w-4 animate-spin" />
                    <span>Sign In</span>
                </button>
            </form>

            <!-- Bottom Navigation Links -->
            <div class="mt-8 text-center text-xs text-slate-500">
                Don't have an account?
                <Link href="/register" class="ml-1 font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
                    Create an account
                </Link>
            </div>
        </div>
    </div>
</template>
