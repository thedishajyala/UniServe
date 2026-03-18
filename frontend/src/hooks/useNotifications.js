import { useEffect, useCallback } from 'react';

/**
 * useNotifications
 * Requests browser notification permission and provides a helper to fire native notifications.
 * Also registers the service worker for PWA / offline support.
 */
export function useNotifications() {
    // Register service worker once on mount
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.warn('SW registration failed:', err);
            });
        }
    }, []);

    // Ask for permission (called once on user interaction)
    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) return 'unsupported';
        if (Notification.permission === 'granted') return 'granted';
        if (Notification.permission === 'denied') return 'denied';
        const result = await Notification.requestPermission();
        return result;
    }, []);

    // Fire a native notification (works even when tab is minimised)
    const notify = useCallback((title, body, url = '/') => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        const n = new Notification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: url, // collapse duplicates
            renotify: true,
        });
        n.onclick = () => {
            window.focus();
            window.location.href = url;
            n.close();
        };
    }, []);

    return { requestPermission, notify };
}
