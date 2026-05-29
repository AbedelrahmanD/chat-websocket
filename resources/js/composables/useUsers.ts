import { ref, watch } from 'vue';
import { router, usePage } from '@inertiajs/vue3';
import { echo } from '@/lib/echo';
import type { User } from '@/types/auth';
import type { Message } from '@/types/chat';
import { route } from 'ziggy-js';

const usersList = ref<User[]>([]);
const currentUser = ref<User | null>(null);
const selectedUser = ref<User | null>(null);
const onlineUsers = ref<number[]>([]);
const unreadCounts = ref<Record<number, number>>({});

export function useUsers() {
    const page = usePage();

    watch(
        () => page.props.auth?.user,
        (newUser) => {
            if (newUser) {
                currentUser.value = newUser as User;
            }
        },
        { deep: true, immediate: true }
    );

    const initUsers = (users: User[], loggedInUser: User | null): void => {
        usersList.value = users;
        currentUser.value = loggedInUser;

        users.forEach(user => {
            unreadCounts.value[Number(user.id)] = user.unread_count || 0;
        });

        if (currentUser.value) {
            echo.private(`App.Models.User.${currentUser.value.id}`)
                .listen('MessageSent', (e: { message: Message }) => {
                    updateUserLatestMessage(e.message);
                    if (!selectedUser.value || Number(selectedUser.value.id) !== Number(e.message.sender_id)) {
                        const senderId = Number(e.message.sender_id);
                        if (unreadCounts.value[senderId] !== undefined) {
                            unreadCounts.value[senderId]++;
                        } else {
                            unreadCounts.value[senderId] = 1;
                        }
                    }
                });
        }

        echo.join('online')
            .here((users: { id: number }[]) => {
                onlineUsers.value = users.map(u => Number(u.id));
            })
            .joining((user: { id: number }) => {
                const id = Number(user.id);
                if (!onlineUsers.value.includes(id)) {
                    onlineUsers.value.push(id);
                }
            })
            .leaving((user: { id: number }) => {
                const id = Number(user.id);
                onlineUsers.value = onlineUsers.value.filter(uId => uId !== id);
            })
            .listen('ProfileUpdated', (e: { user: User }) => {
                handleProfileUpdated(e.user);
            });
    };

    const updateUserLatestMessage = (message: Message): void => {
        const currentUserId = currentUser.value?.id;
        if (!currentUserId) return;
        const otherUserId = Number(message.sender_id) === Number(currentUserId)
            ? Number(message.receiver_id)
            : Number(message.sender_id);
        
        usersList.value = usersList.value.map(u => {
            if (Number(u.id) === otherUserId) {
                return {
                    ...u,
                    latest_message: message
                };
            }
            return u;
        });
    };

    const handleUserLatestMessageUpdate = (message: Message): void => {
        const currentUserId = currentUser.value?.id;
        if (!currentUserId) return;
        const otherUserId = Number(message.sender_id) === Number(currentUserId)
            ? Number(message.receiver_id)
            : Number(message.sender_id);
        
        usersList.value = usersList.value.map(u => {
            if (Number(u.id) === otherUserId && u.latest_message?.id === message.id) {
                return {
                    ...u,
                    latest_message: message
                };
            }
            return u;
        });
    };

    const handleUserLatestMessageDelete = (messageId: number, otherUserId: number): void => {
        usersList.value = usersList.value.map(u => {
            if (Number(u.id) === Number(otherUserId) && u.latest_message?.id === messageId) {
                return {
                    ...u,
                    latest_message: null
                };
            }
            return u;
        });
    };

    const clearUnreadCount = (userId: number): void => {
        unreadCounts.value[Number(userId)] = 0;
    };

    const logout = (): void => {
        router.post(route('logout'));
    };

    const cleanupUsers = (): void => {
        if (currentUser.value) {
            echo.leave(`App.Models.User.${currentUser.value.id}`);
        }
        echo.leave('online');

        usersList.value = [];
        currentUser.value = null;
        selectedUser.value = null;
        onlineUsers.value = [];
        unreadCounts.value = {};
    };

    const handleProfileUpdated = (updatedUser: User): void => {
        const userId = Number(updatedUser.id);
        usersList.value = usersList.value.map(u => {
            if (Number(u.id) === userId) {
                return {
                    ...u,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    avatar: updatedUser.avatar,
                    avatar_url: updatedUser.avatar_url
                };
            }
            return u;
        });

        if (selectedUser.value && Number(selectedUser.value.id) === userId) {
            selectedUser.value = {
                ...selectedUser.value,
                name: updatedUser.name,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
                avatar_url: updatedUser.avatar_url
            };
        }
    };

    return {
        usersList,
        currentUser,
        selectedUser,
        onlineUsers,
        unreadCounts,
        initUsers,
        updateUserLatestMessage,
        handleUserLatestMessageUpdate,
        handleUserLatestMessageDelete,
        handleProfileUpdated,
        clearUnreadCount,
        logout,
        cleanupUsers,
    };
}
