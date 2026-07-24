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
import { route } from './typedRoute';

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
    route('/profils', (context) =>
        renderView(ProfileSelectorViewModel, context)
    ),
    route('/profils/nouveau', (context) =>
        renderView(ProfileCreateViewModel, context)
    ),
    route('/', (context) => renderView(AppViewModel, context), [profileGuard]),
    route('/a-propos', (context) => renderView(AboutViewModel, context)),
    route('/about', (context) => renderView(AboutViewModel, context)),
    route(
        '/entrainement',
        (context) => renderView(TrainingViewModel, context),
        [profileGuard]
    ),
    route('/tables', (context) => renderView(TablesViewModel, context), [
        profileGuard,
    ]),
    route('/quiz/:operation', (context) => renderView(QuizViewModel, context), [
        profileGuard,
    ]),
    route(
        // Catch-all route for 404 pages
        '*',
        () => renderView(NotFoundViewModel)
    ),
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
    routes.forEach((routeConfig) => {
        if (routeConfig.middleware && routeConfig.middleware.length > 0) {
            // If a route has specific middleware, register it
            page(
                routeConfig.path,
                ...routeConfig.middleware,
                routeConfig.handler
            );
        } else {
            // Otherwise register the route handler
            page(routeConfig.path, routeConfig.handler);
        }
    });

    // Start page.js
    page();
};
