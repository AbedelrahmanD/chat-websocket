import { ref, nextTick } from 'vue';
import axios from 'axios';
import { echo } from '@/lib/echo';
import { getConversationId } from '@/lib/utils';
import type { Message, PaginatedMessagesResponse } from '@/types/chat';
import type { User } from '@/types/auth';
import { useUsers } from './useUsers';
import { route } from 'ziggy-js';

const messages = ref<Message[]>([]);
const pagination = ref<{
    nextPageUrl: string | null;
} | null>(null);

const isLoadingMessages = ref(false);
const isLoadingMore = ref(false);
const otherUserIsTyping = ref(false);
const activeChannelName = ref<string | null>(null);
const messageContainerRef = ref<HTMLDivElement | null>(null);
const replyToMessage = ref<Message | null>(null);

export function useMessages() {
    const {
        currentUser,
        selectedUser,
        clearUnreadCount,
        updateUserLatestMessage,
        handleUserLatestMessageUpdate,
        handleUserLatestMessageDelete,
    } = useUsers();

    const scrollToBottom = (): void => {
        nextTick(() => {
            if (messageContainerRef.value) {
                messageContainerRef.value.scrollTop = messageContainerRef.value.scrollHeight;
            }
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

        clearUnreadCount(user.id);

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
                        updateUserLatestMessage(e.message);

                        const currentSelectedUser = selectedUser.value;
                        if (currentSelectedUser && Number(e.message.sender_id) === Number(currentSelectedUser.id)) {
                            axios.post(route('messages.read', currentSelectedUser.id)).catch(err => {
                                console.error('Failed to mark incoming message as read', err);
                            });
                        }
                    }
                })
                .listen('MessagesRead', (e: { conversationId: string; readerId: number; readAt: string }) => {
                    if (Number(e.readerId) === Number(selectedUser.value?.id)) {
                        messages.value.forEach(m => {
                            if (Number(m.sender_id) === Number(currentUser.value?.id)) {
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
                    handleUserLatestMessageUpdate(e.message);
                })
                .listen('MessageDeleted', (e: { messageId: number }) => {
                    messages.value = messages.value.filter(m => m.id !== e.messageId);
                    if (selectedUser.value) {
                        handleUserLatestMessageDelete(e.messageId, selectedUser.value.id);
                    }
                })
                .listen('UserTyping', (e: { userId: number; isTyping: boolean }) => {
                    if (Number(e.userId) === Number(selectedUser.value?.id)) {
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

    const sendMessageText = async (body: string, parentId?: number): Promise<void> => {
        if (!selectedUser.value || !body) return;

        try {
            const formData = new FormData();
            formData.append('receiver_id', selectedUser.value.id.toString());
            formData.append('body', body);
            if (parentId) {
                formData.append('parent_id', parentId.toString());
            }

            const response = await axios.post<Message>(route('messages.store'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (messages.value.findIndex(m => m.id === response.data.id) === -1) {
                messages.value.push(response.data);
                scrollToBottom();
            }
            updateUserLatestMessage(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const sendMessageFiles = async (files: File[], body?: string, parentId?: number): Promise<void> => {
        if (!selectedUser.value || files.length === 0) return;

        try {
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append('receiver_id', selectedUser.value.id.toString());
                if (i === 0 && body) {
                    formData.append('body', body);
                }
                if (i === 0 && parentId) {
                    formData.append('parent_id', parentId.toString());
                }
                formData.append('file', files[i]);

                const response = await axios.post<Message>(route('messages.store'), formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                if (messages.value.findIndex(m => m.id === response.data.id) === -1) {
                    messages.value.push(response.data);
                    scrollToBottom();
                }
                updateUserLatestMessage(response.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const sendMessageVoice = async (audioBlob: Blob, parentId?: number): Promise<void> => {
        if (!selectedUser.value) return;

        try {
            const audioFile = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('receiver_id', selectedUser.value.id.toString());
            formData.append('file', audioFile);
            formData.append('is_audio', '1');
            if (parentId) {
                formData.append('parent_id', parentId.toString());
            }

            const response = await axios.post<Message>(route('messages.store'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (messages.value.findIndex(m => m.id === response.data.id) === -1) {
                messages.value.push(response.data);
                scrollToBottom();
            }
            updateUserLatestMessage(response.data);
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
            handleUserLatestMessageUpdate(response.data);
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const deleteMessage = async (messageId: number): Promise<void> => {
        try {
            await axios.delete(route('messages.destroy', messageId));
            messages.value = messages.value.filter(m => m.id !== messageId);
            if (selectedUser.value) {
                handleUserLatestMessageDelete(messageId, selectedUser.value.id);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const forwardMessage = async (message: Message, targetUserId: number): Promise<void> => {
        try {
            const formData = new FormData();
            formData.append('receiver_id', targetUserId.toString());
            if (message.body) {
                formData.append('body', message.body);
            }
            if (message.file_path) {
                formData.append('file_path', message.file_path);
            }
            if (message.file_name) {
                formData.append('file_name', message.file_name);
            }
            if (message.file_type) {
                formData.append('file_type', message.file_type);
            }
            if (message.file_size) {
                formData.append('file_size', message.file_size.toString());
            }
            if (message.is_audio) {
                formData.append('is_audio', '1');
            }
            formData.append('is_forwarded', '1');

            const response = await axios.post<Message>(route('messages.store'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (selectedUser.value && Number(selectedUser.value.id) === Number(targetUserId)) {
                if (messages.value.findIndex(m => m.id === response.data.id) === -1) {
                    messages.value.push(response.data);
                    scrollToBottom();
                }
            }
            updateUserLatestMessage(response.data);
        } catch (error) {
            console.error('Failed to forward message', error);
            throw error;
        }
    };

    const cleanupMessages = (): void => {
        if (activeChannelName.value) {
            echo.leave(activeChannelName.value);
            activeChannelName.value = null;
        }
        messages.value = [];
        pagination.value = null;
        replyToMessage.value = null;
    };

    return {
        messages,
        pagination,
        isLoadingMessages,
        isLoadingMore,
        otherUserIsTyping,
        activeChannelName,
        messageContainerRef,
        replyToMessage,
        scrollToBottom,
        selectUser,
        backToConversations,
        handleScroll,
        sendTypingNotification,
        sendMessageText,
        sendMessageFiles,
        sendMessageVoice,
        forwardMessage,
        updateMessage,
        deleteMessage,
        cleanupMessages,
    };
}
