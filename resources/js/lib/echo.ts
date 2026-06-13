import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

if (typeof window !== 'undefined') {
    (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;
    (window as unknown as { axios: typeof axios }).axios = axios;
}

export const echo = typeof window !== 'undefined'
    ? new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: window.location.hostname,
        wsPort: import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT) : 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT) : 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
    })
    : undefined;
