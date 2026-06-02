/// <reference types="vite/client" />

import type PageJS from 'page';

declare global {
    interface Window {
        page: typeof PageJS & { show: (path: string) => void };
    }

    const __APP_VERSION__: string;
    const __BUILD_COMMIT__: string;
    const __BUILD_DATE__: string;
}
