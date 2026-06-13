import { ref } from 'vue';
import axios from 'axios';

const isSupported = ref(false);
const isSubscribed = ref(false);
const permission = ref<NotificationPermission>('default');

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const checkSupport = (): void => {
        isSupported.value = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        if (isSupported.value) {
            permission.value = Notification.permission;
        }
    };

    const checkSubscription = async (): Promise<void> => {
        checkSupport();
        if (!isSupported.value) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            isSubscribed.value = !!subscription;
        } catch {}
    };

    const subscribe = async (): Promise<void> => {
        checkSupport();
        if (!isSupported.value) return;

        try {
            const result = await Notification.requestPermission();
            permission.value = result;
            if (result !== 'granted') return;

            const registration = await navigator.serviceWorker.ready;
            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) return;

            const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });

            await axios.post('/chat/push-subscriptions', subscription);
            isSubscribed.value = true;
        } catch {}
    };

    const unsubscribe = async (): Promise<void> => {
        checkSupport();
        if (!isSupported.value) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await axios.delete('/chat/push-subscriptions', {
                    data: { endpoint: subscription.endpoint }
                });

                await subscription.unsubscribe();
                isSubscribed.value = false;
            }
        } catch {}
    };

    return {
        isSupported,
        isSubscribed,
        permission,
        checkSubscription,
        subscribe,
        unsubscribe
    };
}
