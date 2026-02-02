export type * from './application';
export type * from './auth';
export type * from './navigation';
export type * from './ui';

import type { Auth } from './auth';

export type FlashMessages = {
    success?: string;
    error?: string;
};

export type SharedData = {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    flash: FlashMessages;
    [key: string]: unknown;
};
