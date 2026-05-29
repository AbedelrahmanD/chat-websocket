<script setup lang="ts">
import { ref } from 'vue';
import { useForm, Head, Link } from '@inertiajs/vue3';
import { Eye, EyeOff, Lock, Mail, User, Loader2 } from '@lucide/vue';

const showPassword = ref(false);

const form = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
});

const submit = (): void => {
    form.post('/register', {
        onFinish: () => {
            form.reset('password', 'password_confirmation');
        },
    });
};
</script>

<template>
    <Head title="Create Account" />

    <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4 sm:p-6">
        <!-- Animated Background Blobs -->
        <div class="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-500/10 blur-[120px] animate-pulse"></div>
        <div class="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px] animate-pulse duration-4000"></div>

        <!-- Register Container -->
        <div class="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl sm:p-10 animate-fade-in">
            <!-- Header -->
            <div class="mb-8 text-center">
                <div class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                    <User class="h-6 w-6" />
                </div>
                <h1 class="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Get Started</h1>
                <p class="mt-2 text-sm text-slate-500">Create a new account to join the chat app</p>
            </div>

            <!-- Register Form -->
            <form @submit.prevent="submit" class="space-y-5">
                <!-- Name Field -->
                <div class="form-group">
                    <label for="name" class="form-label">Full Name</label>
                    <div class="form-input-wrapper">
                        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <User class="form-icon" />
                        </div>
                        <input
                            id="name"
                            v-model="form.name"
                            type="text"
                            required
                            autocomplete="name"
                            placeholder="John Doe"
                            class="form-input"
                            :class="{ 'form-input-error': form.errors.name }"
                        />
                    </div>
                    <span v-if="form.errors.name" class="form-error">{{ form.errors.name }}</span>
                </div>

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
                            autocomplete="new-password"
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

                <!-- Confirm Password Field -->
                <div class="form-group">
                    <label for="password_confirmation" class="form-label">Confirm Password</label>
                    <div class="form-input-wrapper">
                        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Lock class="form-icon" />
                        </div>
                        <input
                            id="password_confirmation"
                            v-model="form.password_confirmation"
                            type="password"
                            required
                            autocomplete="new-password"
                            placeholder="••••••••"
                            class="form-input"
                            :class="{ 'form-input-error': form.errors.password_confirmation }"
                        />
                    </div>
                    <span v-if="form.errors.password_confirmation" class="form-error">{{ form.errors.password_confirmation }}</span>
                </div>

                <!-- Submit Button -->
                <button
                    type="submit"
                    :disabled="form.processing"
                    class="relative flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition duration-200 hover:from-violet-500 hover:to-indigo-500 hover:shadow-indigo-500/35 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                >
                    <Loader2 v-if="form.processing" class="mr-2 h-4 w-4 animate-spin" />
                    <span>Create Account</span>
                </button>
            </form>

            <!-- Bottom Navigation Links -->
            <div class="mt-8 text-center text-xs text-slate-500">
                Already have an account?
                <Link href="/login" class="ml-1 font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
                    Sign In
                </Link>
            </div>
        </div>
    </div>
</template>
