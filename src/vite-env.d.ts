/// <reference types="vite/client" />

import type PageJS from 'page';

declare global {
    interface Window {
        page: typeof PageJS & { show: (path: string) => void };
    }
}
