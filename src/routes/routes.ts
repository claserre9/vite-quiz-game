import { renderView } from '@core/BaseViewModel';
import { AppViewModel } from '@components/AppViewModel';
import { NotFoundViewModel } from '@components/NotFoundViewModel';
import {
    logPathMiddleware,
    authGuard,
    roleGuard,
} from '@middlewares/middlewares';
import { AboutViewModel } from '@components/AboutViewModel';
import { DashboardViewModel } from '@components/DashboardViewModel';
import { DashboardHomeViewModel } from '@components/DashboardHomeViewModel';
import { DashboardProfileViewModel } from '@components/DashboardProfileViewModel';
import { DashboardSettingsViewModel } from '@components/DashboardSettingsViewModel';
import { AdminViewModel } from '@components/AdminViewModel';
import { LoginViewModel } from '@components/LoginViewModel';
import { AccessDeniedViewModel } from '@components/AccessDeniedViewModel';
import { ContactFormViewModel } from '@components/ContactFormViewModel';
import { SimpleFormViewModel } from '@components/SimpleFormViewModel';

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

const dashboardLayoutMiddleware = (
    context: PageJS.Context,
    next: () => void
): void => {
    const layout = renderView(DashboardViewModel, context);
    context.state.layout = layout;
    next();
};

/**
 * Application routes configuration
 */
export const routes: RouteConfig[] = [
    {
        path: '/',
        handler: (context) => renderView(AppViewModel, context),
    },
    {
        path: '/about',
        handler: (context) => renderView(AboutViewModel, context),
    },
    {
        path: '/dashboard',
        middleware: [authGuard, dashboardLayoutMiddleware],
        handler: (context) => {
            const layout = context.state.layout as DashboardViewModel;
            layout.renderContent(DashboardHomeViewModel, context);
        },
    },
    {
        path: '/dashboard/profile',
        middleware: [authGuard, dashboardLayoutMiddleware],
        handler: (context) => {
            const layout = context.state.layout as DashboardViewModel;
            layout.renderContent(DashboardProfileViewModel, context);
        },
    },
    {
        path: '/dashboard/settings',
        middleware: [authGuard, dashboardLayoutMiddleware],
        handler: (context) => {
            const layout = context.state.layout as DashboardViewModel;
            layout.renderContent(DashboardSettingsViewModel, context);
        },
    },
    {
        path: '/admin',
        middleware: [authGuard, roleGuard('admin')],
        handler: (context) => renderView(AdminViewModel, context),
    },
    {
        path: '/login',
        handler: (context) => renderView(LoginViewModel, context),
    },
    {
        path: '/contact',
        handler: (context) => renderView(ContactFormViewModel, context),
    },
    {
        path: '/simple-form',
        handler: (context) => renderView(SimpleFormViewModel, context),
    },
    {
        path: '/access-denied',
        handler: (context) => renderView(AccessDeniedViewModel, context),
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
