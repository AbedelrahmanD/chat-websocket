import type { Message } from './chat';

export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    avatar_url?: string | null;
    unread_count?: number;
    latest_message?: Message | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};
