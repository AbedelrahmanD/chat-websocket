export type Message = {
    id: number;
    sender_id: number;
    receiver_id: number;
    conversation_id: string;
    body: string | null;
    read_at: string | null;
    file_path: string | null;
    file_url: string | null;
    file_name: string | null;
    file_type: string | null;
    file_size: number | null;
    is_audio: boolean;
    parent_id?: number | null;
    parent?: Message | null;
    is_forwarded?: boolean;
    created_at: string;
    updated_at: string;
};

export type CursorPaginationMeta = {
    path: string;
    per_page: number;
    next_cursor: string | null;
    next_page_url: string | null;
    prev_cursor: string | null;
    prev_page_url: string | null;
};

export type PaginatedMessagesResponse = {
    data: Message[];
} & CursorPaginationMeta;
