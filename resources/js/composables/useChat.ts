import { ref, nextTick } from 'vue';
import axios from 'axios';
import { router } from '@inertiajs/vue3';
import { echo } from '@/lib/echo';
import { getConversationId } from '@/lib/utils';
import type { User } from '@/types/auth';
import type { Message, PaginatedMessagesResponse } from '@/types/chat';
import { route } from 'ziggy-js';

// Axios setup
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Shared global state across components (singleton store pattern)
const usersList = ref<User[]>([]);
const currentUser = ref<User | null>(null);
const selectedUser = ref<User | null>(null);
const messages = ref<Message[]>([]);
const pagination = ref<{
    nextPageUrl: string | null;
} | null>(null);

const isLoadingMessages = ref(false);
const isLoadingMore = ref(false);
const otherUserIsTyping = ref(false);
const activeChannelName = ref<string | null>(null);

const onlineUsers = ref<number[]>([]);
const unreadCounts = ref<Record<number, number>>({});
const messageContainerRef = ref<HTMLDivElement | null>(null);

export function useChat() {
    const scrollToBottom = (): void => {
        nextTick(() => {
            if (messageContainerRef.value) {
                messageContainerRef.value.scrollTop = messageContainerRef.value.scrollHeight;
            }
        });
    };

    const init = (users: User[], loggedInUser: User | null): void => {
        usersList.value = users;
        currentUser.value = loggedInUser;

        // Initialize unread counts
        users.forEach(user => {
            unreadCounts.value[user.id] = user.unread_count || 0;
        });

        // Listen to personal channel for new message notifications from other users
        if (currentUser.value) {
            echo.private(`App.Models.User.${currentUser.value.id}`)
                .listen('MessageSent', (e: { message: Message }) => {
                    if (!selectedUser.value || selectedUser.value.id !== e.message.sender_id) {
                        const senderId = e.message.sender_id;
                        if (unreadCounts.value[senderId] !== undefined) {
                            unreadCounts.value[senderId]++;
                        } else {
                            unreadCounts.value[senderId] = 1;
                        }
                    }
                });
        }

        // Join online presence channel
        echo.join('online')
            .here((users: { id: number }[]) => {
                onlineUsers.value = users.map(u => u.id);
            })
            .joining((user: { id: number }) => {
                if (!onlineUsers.value.includes(user.id)) {
                    onlineUsers.value.push(user.id);
                }
            })
            .leaving((user: { id: number }) => {
                onlineUsers.value = onlineUsers.value.filter(id => id !== user.id);
            });
    };

    const selectUser = async (user: User): Promise<void> => {
        if (activeChannelName.value) {
            echo.leave(activeChannelName.value);
            activeChannelName.value = null;
        }

        selectedUser.value = user;
        messages.value = [];
        pagination.value = null;
        otherUserIsTyping.value = false;
        isLoadingMessages.value = true;

        // Clear local unread count for this user
        unreadCounts.value[user.id] = 0;

        const currentUserId = currentUser.value?.id ?? 0;
        const otherUserId = user.id;
        const conversationId = getConversationId(currentUserId, otherUserId);
        activeChannelName.value = 'chat.' + conversationId;

        try {
            const response = await axios.get<PaginatedMessagesResponse>(route('messages.index', user.id));
            messages.value = response.data.data.reverse();
            pagination.value = {
                nextPageUrl: response.data.next_page_url,
            };

            echo.private(activeChannelName.value)
                .listen('MessageSent', (e: { message: Message }) => {
                    if (messages.value.findIndex(m => m.id === e.message.id) === -1) {
                        messages.value.push(e.message);
                        scrollToBottom();

                        // If we are actively viewing this chat, automatically mark incoming messages as read
                        if (e.message.sender_id === selectedUser.value?.id) {
                            axios.post(route('messages.read', selectedUser.value.id)).catch(err => {
                                console.error('Failed to mark incoming message as read', err);
                            });
                        }
                    }
                })
                .listen('MessagesRead', (e: { conversationId: string; readerId: number; readAt: string }) => {
                    // If the other user read our messages, update the read status of all our sent messages in real-time
                    if (e.readerId === selectedUser.value?.id) {
                        messages.value.forEach(m => {
                            if (m.sender_id === currentUser.value?.id) {
                                m.read_at = e.readAt;
                            }
                        });
                    }
                })
                .listen('MessageUpdated', (e: { message: Message }) => {
                    const index = messages.value.findIndex(m => m.id === e.message.id);
                    if (index !== -1) {
                        messages.value[index] = e.message;
                    }
                })
                .listen('MessageDeleted', (e: { messageId: number }) => {
                    messages.value = messages.value.filter(m => m.id !== e.messageId);
                })
                .listen('UserTyping', (e: { userId: number; isTyping: boolean }) => {
                    if (e.userId === selectedUser.value?.id) {
                        otherUserIsTyping.value = e.isTyping;
                    }
                });

            isLoadingMessages.value = false;
            scrollToBottom();
        } catch (error) {
            console.error(error);
            isLoadingMessages.value = false;
        }
    };

    const backToConversations = (): void => {
        if (activeChannelName.value) {
            echo.leave(activeChannelName.value);
            activeChannelName.value = null;
        }
        selectedUser.value = null;
    };

    const handleScroll = async (): Promise<void> => {
        const container = messageContainerRef.value;
        if (container && container.scrollTop === 0 && pagination.value?.nextPageUrl && !isLoadingMore.value) {
            isLoadingMore.value = true;
            const previousScrollHeight = container.scrollHeight;
            const previousScrollTop = container.scrollTop;

            try {
                const response = await axios.get<PaginatedMessagesResponse>(pagination.value.nextPageUrl);
                const olderMessages = response.data.data.reverse();
                messages.value = [...olderMessages, ...messages.value];
                pagination.value = {
                    nextPageUrl: response.data.next_page_url,
                };

                await nextTick();
                container.scrollTop = container.scrollHeight - previousScrollHeight + previousScrollTop;
            } catch (error) {
                console.error(error);
            } finally {
                isLoadingMore.value = false;
            }
        }
    };

    const sendTypingNotification = async (typingState: boolean): Promise<void> => {
        if (!selectedUser.value) return;
        try {
            await axios.post(route('messages.typing'), {
                receiver_id: selectedUser.value.id,
                is_typing: typingState,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const sendMessageText = async (body: string): Promise<void> => {
        if (!selectedUser.value || !body) return;

        try {
            const formData = new FormData();
            formData.append('receiver_id', selectedUser.value.id.toString());
            formData.append('body', body);

            const response = await axios.post<Message>(route('messages.store'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (messages.value.findIndex(m => m.id === response.data.id) === -1) {
                messages.value.push(response.data);
                scrollToBottom();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const sendMessageFiles = async (files: File[], body?: string): Promise<void> => {
        if (!selectedUser.value || files.length === 0) return;

        try {
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append('receiver_id', selectedUser.value.id.toString());
                if (i === 0 && body) {
                    formData.append('body', body);
                }
                formData.append('file', files[i]);

                const response = await axios.post<Message>(route('messages.store'), formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                if (messages.value.findIndex(m => m.id === response.data.id) === -1) {
                    messages.value.push(response.data);
                    scrollToBottom();
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const sendMessageVoice = async (audioBlob: Blob): Promise<void> => {
        if (!selectedUser.value) return;

        try {
            const audioFile = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('receiver_id', selectedUser.value.id.toString());
            formData.append('file', audioFile);
            formData.append('is_audio', '1');

            const response = await axios.post<Message>(route('messages.store'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (messages.value.findIndex(m => m.id === response.data.id) === -1) {
                messages.value.push(response.data);
                scrollToBottom();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const updateMessage = async (messageId: number, body: string): Promise<void> => {
        try {
            const response = await axios.put<Message>(route('messages.update', messageId), {
                body,
            });
            const index = messages.value.findIndex(m => m.id === messageId);
            if (index !== -1) {
                messages.value[index] = response.data;
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const deleteMessage = async (messageId: number): Promise<void> => {
        try {
            await axios.delete(route('messages.destroy', messageId));
            messages.value = messages.value.filter(m => m.id !== messageId);
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const logout = (): void => {
        router.post(route('logout'));
    };

    const cleanup = (): void => {
        if (activeChannelName.value) {
            echo.leave(activeChannelName.value);
            activeChannelName.value = null;
        }
        if (currentUser.value) {
            echo.leave(`App.Models.User.${currentUser.value.id}`);
        }
        echo.leave('online');

        // Clear state variables
        usersList.value = [];
        currentUser.value = null;
        selectedUser.value = null;
        messages.value = [];
        pagination.value = null;
        onlineUsers.value = [];
        unreadCounts.value = {};
    };

    return {
        usersList,
        currentUser,
        selectedUser,
        messages,
        pagination,
        isLoadingMessages,
        isLoadingMore,
        otherUserIsTyping,
        onlineUsers,
        unreadCounts,
        messageContainerRef,
        init,
        selectUser,
        backToConversations,
        handleScroll,
        sendTypingNotification,
        sendMessageText,
        sendMessageFiles,
        sendMessageVoice,
        updateMessage,
        deleteMessage,
        logout,
        cleanup,
        scrollToBottom,
    };
}
