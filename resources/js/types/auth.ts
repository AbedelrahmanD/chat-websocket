export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    unread_count?: number;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};
