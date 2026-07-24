import { renderView } from '@core/BaseViewModel';
import { AppViewModel } from '@components/AppViewModel';
import { NotFoundViewModel } from '@components/NotFoundViewModel';
import { logPathMiddleware, profileGuard } from '@middlewares/middlewares';
import { AboutViewModel } from '@components/AboutViewModel';
import { QuizViewModel } from '@components/QuizViewModel';
import { TrainingViewModel } from '@components/TrainingViewModel';
import { TablesViewModel } from '@components/TablesViewModel';
import { ProfileSelectorViewModel } from '@components/ProfileSelectorViewModel';
import { ProfileCreateViewModel } from '@components/ProfileCreateViewModel';

/**
 * Route configuration interface
 */
export interface RouteConfig {
    path: string;
    handler: (context: PageJS.Context) => void;
    middleware?: ((context: PageJS.Context, next: () => void) => void)[];
}

/**
 * Global middleware applied to all routes
 */
export const globalMiddleware = [logPathMiddleware];

/**
 * Application routes configuration
 */
export const routes: RouteConfig[] = [
    {
        path: '/profils',
        handler: (context) => renderView(ProfileSelectorViewModel, context),
    },
    {
        path: '/profils/nouveau',
        handler: (context) => renderView(ProfileCreateViewModel, context),
    },
    {
        path: '/',
        middleware: [profileGuard],
        handler: (context) => renderView(AppViewModel, context),
    },
    {
        path: '/a-propos',
        handler: (context) => renderView(AboutViewModel, context),
    },
    {
        path: '/about',
        handler: (context) => renderView(AboutViewModel, context),
    },
    {
        path: '/entrainement',
        middleware: [profileGuard],
        handler: (context) => renderView(TrainingViewModel, context),
    },
    {
        path: '/tables',
        middleware: [profileGuard],
        handler: (context) => renderView(TablesViewModel, context),
    },
    {
        path: '/quiz/:operation',
        middleware: [profileGuard],
        handler: (context) => renderView(QuizViewModel, context),
    },
    {
        // Catch-all route for 404 pages
        path: '*',
        handler: () => renderView(NotFoundViewModel),
    },
];

/**
 * Helper function to register all routes with page.js
 *
 * @param page - The page.js instance
 */
export const registerRoutes = (page: PageJS.Static): void => {
    // Register global middleware
    globalMiddleware.forEach((middleware) => {
        page('*', middleware);
    });

    // Register all routes
    routes.forEach((route) => {
        if (route.middleware && route.middleware.length > 0) {
            // If a route has specific middleware, register it
            page(route.path, ...route.middleware, route.handler);
        } else {
            // Otherwise register the route handler
            page(route.path, route.handler);
        }
    });

    // Start page.js
    page();
};
