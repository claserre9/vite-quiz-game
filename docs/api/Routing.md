# Routing System API Documentation

Quiz Math's routing system is built on top of [page.js](https://github.com/visionmedia/page.js), a small client-side routing library. This document describes the routing configuration and usage within the application.

## Route Configuration

### RouteConfig Interface

```typescript
export interface RouteConfig {
    path: string;
    handler: (context: PageJS.Context) => void;
    middleware?: ((context: PageJS.Context, next: () => void) => void)[];
}
```

**Properties:**

- `path`: The URL path pattern to match (follows page.js syntax)
- `handler`: The function to execute when the route is matched
- `middleware` (optional): Array of middleware functions to execute before the handler

## Global Middleware

Global middleware functions are applied to all routes in the application.

```typescript
export const globalMiddleware = [
    logPathMiddleware,
    // Add other global middleware here
];
```

## Route Definitions

Routes are defined as an array of `RouteConfig` objects:

```typescript
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
        // Catch-all route for 404 pages
        path: '*',
        handler: () => renderView(NotFoundViewModel),
    },
];
```

## Route Registration

The `registerRoutes` function is used to register all routes with page.js:

```typescript
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
```

## Route Parameters

Page.js supports route parameters using the `:param` syntax:

```typescript
{
    path: "/user/:id",
    handler: (context) => {
        const userId = context.params.id;
        // Use userId to load data or render the view
        renderView(UserViewModel, context);
    }
}
```

## Nested Routes

While page.js doesn't natively support nested routes, you can implement them by using path prefixes:

```typescript
// Parent route
{
    path: "/settings",
    handler: (context) => renderView(SettingsViewModel, context)
},
// Child routes
{
    path: "/settings/profile",
    handler: (context) => renderView(SettingsProfileViewModel, context)
},
{
    path: "/settings/preferences",
    handler: (context) => renderView(SettingsPreferencesViewModel, context)
}
```

## Route Guards

Route guards can be implemented using middleware. This app's own `profileGuard`
(in `src/middlewares/middlewares.ts`) is a real example — it redirects to the
profile picker when no local profile is active yet:

```typescript
export function profileGuard(_context: PageJS.Context, next: () => void): void {
    if (ProfileStore.getActiveProfile()) {
        next(); // Continue to the route handler
    } else {
        page.redirect('/profils'); // No active profile yet
    }
}

// Applied to protected routes
{
    path: "/entrainement",
    middleware: [profileGuard],
    handler: (context) => renderView(TrainingViewModel, context)
}
```

## Programmatic Navigation

You can navigate programmatically using page.js:

```typescript
// Navigate to a specific route
page('/about');

// Navigate with query parameters
page('/search?query=example');

// Navigate with route parameters
page('/user/123');

// Redirect (replaces current history entry)
page.redirect('/new-location');
```
