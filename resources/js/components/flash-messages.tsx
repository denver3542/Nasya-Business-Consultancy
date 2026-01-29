import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast, Toaster } from 'sonner';

import type { SharedData } from '@/types';

export function FlashMessages() {
    const { flash } = usePage<SharedData>().props;
    const shownMessages = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (flash?.success) {
            const messageKey = `success:${flash.success}`;
            if (!shownMessages.current.has(messageKey)) {
                shownMessages.current.add(messageKey);
                toast.success(flash.success, {
                    duration: 5000,
                    id: messageKey,
                });
                // Clear after a short delay to allow the same message to show again on next navigation
                setTimeout(() => {
                    shownMessages.current.delete(messageKey);
                }, 100);
            }
        }

        if (flash?.error) {
            const messageKey = `error:${flash.error}`;
            if (!shownMessages.current.has(messageKey)) {
                shownMessages.current.add(messageKey);
                toast.error(flash.error, {
                    duration: 7000,
                    id: messageKey,
                });
                setTimeout(() => {
                    shownMessages.current.delete(messageKey);
                }, 100);
            }
        }
    }, [flash?.success, flash?.error]);

    return (
        <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
                classNames: {
                    toast: 'group',
                },
            }}
        />
    );
}
