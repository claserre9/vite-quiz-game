import page from 'page';
import { appStore } from '@store/AppStore';

export function logPathMiddleware(
    context: { path: string },
    next: () => void
): void {
    console.log(
        `%c${context.path}`,
        'color: white; background-color: blue; padding: 4px; border-radius: 4px;'
    );
    next();
}

export function authGuard(_context: PageJS.Context, next: () => void): void {
    const { authToken } = appStore.getState();
    if (authToken) {
        next();
    } else {
        console.warn('Authentication required. Redirecting to login page.');
        page.redirect('/login');
    }
}

export function roleGuard(requiredRole: string) {
    return (_context: PageJS.Context, next: () => void): void => {
        const { userRole } = appStore.getState();
        if (userRole === requiredRole) {
            next();
        } else {
            console.warn(`Access denied. Role ${requiredRole} required.`);
            page.redirect('/access-denied');
        }
    };
}
