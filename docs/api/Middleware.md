# Middleware System API Documentation

The middleware system in Knockout Page Vite provides a way to intercept and process route requests before they reach their handlers. This allows for cross-cutting concerns like logging, authentication, and data loading to be handled separately from the route handlers.

## Middleware Pattern

Middleware functions follow the page.js middleware pattern:

```typescript
type MiddlewareFunction = (context: PageJS.Context, next: () => void) => void;
```

**Parameters:**

- `context`: The page.js context object containing route information
- `next`: A function to call when the middleware is done, passing control to the next middleware or route handler

## Built-in Middleware

### logPathMiddleware

Logs the current path to the console with styling:

```typescript
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
```

## Applying Middleware

Middleware can be applied globally to all routes or to specific routes.

### Global Middleware

Global middleware is applied to all routes in the application:

```typescript
export const globalMiddleware = [
    logPathMiddleware,
    // Add other global middleware here
];

// In registerRoutes function:
globalMiddleware.forEach((middleware) => {
    page('*', middleware);
});
```

### Route-specific Middleware

Middleware can also be applied to specific routes:

```typescript
{
    path: "/protected",
    middleware: [authMiddleware, loadDataMiddleware],
    handler: (context) => renderView(ProtectedViewModel, context)
}
```

## Creating Custom Middleware

### Authentication Middleware Example

```typescript
export function authMiddleware(
    context: PageJS.Context,
    next: () => void
): void {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('auth_token') !== null;

    if (isAuthenticated) {
        // User is authenticated, proceed to next middleware or route handler
        next();
    } else {
        // User is not authenticated, redirect to login page
        console.warn('Authentication required. Redirecting to login page.');
        page.redirect('/login');
    }
}
```

### Data Loading Middleware Example

```typescript
export function loadUserDataMiddleware(
    context: PageJS.Context,
    next: () => void
): void {
    // Extract user ID from route parameters
    const userId = context.params.id;

    // Fetch user data
    fetchUserData(userId)
        .then((userData) => {
            // Attach user data to context for use in route handler
            context.state.userData = userData;
            next();
        })
        .catch((error) => {
            console.error('Failed to load user data:', error);
            // Handle error (e.g., redirect to error page)
            page.redirect('/error');
        });
}
```

### Error Handling Middleware Example

```typescript
export function errorHandlingMiddleware(
    context: PageJS.Context,
    next: () => void
): void {
    try {
        // Wrap next() in try/catch to catch synchronous errors
        next();
    } catch (error) {
        console.error('Route error:', error);
        // Handle error (e.g., show error message, redirect)
        page.redirect('/error');
    }
}
```

## Middleware Execution Order

Middleware functions are executed in the order they are registered:

1. Global middleware (in the order they appear in the `globalMiddleware` array)
2. Route-specific middleware (in the order they appear in the route's `middleware` array)
3. Route handler

## Best Practices

1. **Keep middleware focused**: Each middleware function should handle a single concern.
2. **Use middleware for cross-cutting concerns**: Authentication, logging, analytics, and data loading are good candidates for middleware.
3. **Pass data through context**: Use `context.state` to pass data between middleware and route handlers.
4. **Always call next()**: Ensure that `next()` is called to continue the middleware chain, unless you're intentionally stopping the chain (e.g., with a redirect).
5. **Handle errors**: Use try/catch blocks or promises with catch handlers to prevent unhandled errors from breaking the application.
