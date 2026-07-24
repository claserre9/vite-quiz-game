import page from 'page';
import { ProfileStore } from '@store/ProfileStore';

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

export function profileGuard(_context: PageJS.Context, next: () => void): void {
    if (ProfileStore.getActiveProfile()) {
        next();
    } else {
        page.redirect('/profils');
    }
}
