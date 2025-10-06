# Middleware Examples

This document provides examples of common middleware patterns and usage for the Knockout Page Vite application.

## Basic Logging Middleware

A simple middleware that logs route navigation:

```typescript
// middlewares/loggingMiddleware.ts
export function loggingMiddleware(
    context: PageJS.Context,
    next: () => void
): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Navigating to: ${context.path}`);
    next();
}

// Usage in routes.ts
import { loggingMiddleware } from '../middlewares/loggingMiddleware';

export const globalMiddleware = [loggingMiddleware];

export const registerRoutes = (page: PageJS.Static): void => {
    // Register global middleware
    globalMiddleware.forEach((middleware) => {
        page('*', middleware);
    });

    // Register routes...
};
```

## Styled Console Logging

Enhanced logging with styled console output:

```typescript
// middlewares/styledLoggingMiddleware.ts
export function styledLoggingMiddleware(
    context: PageJS.Context,
    next: () => void
): void {
    // Define styles for different route types
    let style = 'color: white; padding: 4px; border-radius: 4px;';

    if (context.path.startsWith('/admin')) {
        style += ' background-color: #d9534f;'; // Red for admin routes
    } else if (context.path.startsWith('/user')) {
        style += ' background-color: #5bc0de;'; // Blue for user routes
    } else if (context.path === '/') {
        style += ' background-color: #5cb85c;'; // Green for home page
    } else {
        style += ' background-color: #f0ad4e;'; // Orange for other routes
    }

    console.log(`%c${context.path}`, style);
    next();
}
```

## Authentication Middleware

Middleware for checking user authentication:

```typescript
// middlewares/authMiddleware.ts
import page from 'page';

// Simple authentication check
export function authMiddleware(
    context: PageJS.Context,
    next: () => void
): void {
    const authToken = localStorage.getItem('auth_token');

    if (authToken) {
        // User is authenticated, proceed to next middleware or route handler
        next();
    } else {
        // User is not authenticated, redirect to login page
        console.warn('Authentication required. Redirecting to login page.');

        // Store the original URL to redirect back after login
        localStorage.setItem('auth_redirect', context.path);

        page.redirect('/login');
    }
}

// Usage in routes.ts
import { authMiddleware } from '../middlewares/authMiddleware';

export const routes = [
    // Public routes
    {
        path: '/',
        handler: (context) => renderView(HomeViewModel, context),
    },
    {
        path: '/login',
        handler: (context) => renderView(LoginViewModel, context),
    },

    // Protected routes
    {
        path: '/profile',
        middleware: [authMiddleware],
        handler: (context) => renderView(ProfileViewModel, context),
    },
    {
        path: '/settings',
        middleware: [authMiddleware],
        handler: (context) => renderView(SettingsViewModel, context),
    },
];
```

## Role-based Authorization Middleware

Middleware for role-based access control:

```typescript
// middlewares/roleMiddleware.ts
import page from 'page';

// Get user from local storage
function getCurrentUser() {
    const userJson = localStorage.getItem('user');
    if (userJson) {
        try {
            return JSON.parse(userJson);
        } catch (e) {
            console.error('Failed to parse user data:', e);
        }
    }
    return null;
}

// Role-based authorization middleware factory
export function requireRole(requiredRole: string) {
    return function (context: PageJS.Context, next: () => void): void {
        const user = getCurrentUser();

        if (user && user.role === requiredRole) {
            // User has the required role, proceed
            next();
        } else {
            // User doesn't have the required role
            console.warn(`Access denied. Role ${requiredRole} required.`);
            page.redirect('/access-denied');
        }
    };
}

// Usage in routes.ts
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

export const routes = [
    // Admin routes
    {
        path: '/admin',
        middleware: [authMiddleware, requireRole('admin')],
        handler: (context) => renderView(AdminViewModel, context),
    },

    // Moderator routes
    {
        path: '/moderator',
        middleware: [authMiddleware, requireRole('moderator')],
        handler: (context) => renderView(ModeratorViewModel, context),
    },
];
```

## Data Loading Middleware

Middleware for loading data before rendering a view:

```typescript
// middlewares/dataLoadingMiddleware.ts
import page from 'page';

// Generic data loading middleware factory
export function loadData<T>(
    dataLoader: (context: PageJS.Context) => Promise<T>,
    dataKey: string = 'data'
) {
    return function(context: PageJS.Context, next: () => void): void {
        // Set loading state
        context.state.isLoading = true;

        dataLoader(context)
            .then(data => {
                // Store the loaded data in context.state
                context.state[dataKey] = data;
                context.state.isLoading = false;
                next();
            })
            .catch(error => {
                console.error(`Failed to load ${dataKey}:`, error);
                context.state.error = error;
                context.state.isLoading = false;
                next();
            });
    };
}

// Example data loaders
export function loadUserData(userId: string): Promise<any> {
    return fetch(`/api/users/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load user: ${response.statusText}`);
            }
            return response.json();
        });
}

export function loadProductData(productId: string): Promise<any> {
    return fetch(`/api/products/${productId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load product: ${response.statusText}`);
            }
            return response.json();
        });
}

// Usage in routes.ts
import { authMiddleware } from "../middlewares/authMiddleware";
import { loadData, loadUserData, loadProductData } from "../middlewares/dataLoadingMiddleware";

export const routes = [
    // User profile with data loading
    {
        path: "/user/:id",
        middleware: [
            authMiddleware,
            (context, next) => loadData(
                () => loadUserData(context.params.id),
                'userData'
            )(context, next)
        ],
        handler: (context) => renderView(UserProfileViewModel, context)
    },

    // Product details with data loading
    {
        path: "/product/:id",
        middleware: [
            (context, next) => loadData(
                () => loadProductData(context.params.id),
                'productData'
            )(context, next)
        ],
        handler: (context) => renderView(ProductViewModel, context)
    }
];

// In UserProfileViewModel.ts
constructor(context: PageJS.Context | undefined) {
    super(context);

    // Access the loaded data from context
    if (context && context.state.userData) {
        this.userData(context.state.userData);
    }

    // Check for loading state
    this.isLoading(context && context.state.isLoading === true);

    // Check for errors
    if (context && context.state.error) {
        this.error(context.state.error.message);
    }

    // Set template...
}
```

## Error Handling Middleware

Middleware for catching and handling errors:

```typescript
// middlewares/errorHandlingMiddleware.ts
import page from 'page';

export function errorHandlingMiddleware(context: PageJS.Context, next: () => void): void {
    try {
        // Set up error handler for unhandled promise rejections
        const originalOnUnhandledRejection = window.onunhandledrejection;

        window.onunhandledrejection = function(event) {
            console.error('Unhandled promise rejection:', event.reason);
            context.state.error = event.reason;
            page.redirect('/error');

            // Prevent default handling
            event.preventDefault();
        };

        // Call next middleware or route handler
        next();

        // Restore original handler
        window.onunhandledrejection = originalOnUnhandledRejection;
    } catch (error) {
        // Handle synchronous errors
        console.error('Route error:', error);
        context.state.error = error;
        page.redirect('/error');
    }
}

// Usage in routes.ts
import { errorHandlingMiddleware } from "../middlewares/errorHandlingMiddleware";

export const globalMiddleware = [
    errorHandlingMiddleware,
    // Other global middleware...
];

export const routes = [
    // Error page
    {
        path: "/error",
        handler: (context) => renderView(ErrorViewModel, context)
    },
    // Other routes...
];

// In ErrorViewModel.ts
constructor(context: PageJS.Context | undefined) {
    super(context);

    // Get error from context
    let errorMessage = 'An unknown error occurred';

    if (context && context.state.error) {
        if (typeof context.state.error === 'string') {
            errorMessage = context.state.error;
        } else if (context.state.error instanceof Error) {
            errorMessage = context.state.error.message;
        } else if (context.state.error.toString) {
            errorMessage = context.state.error.toString();
        }
    }

    this.errorMessage = errorMessage;

    this.setTemplate(`
        <div class="error-page">
            <h1>Error</h1>
            <p class="error-message">${this.errorMessage}</p>
            <button data-bind="click: goHome">Return to Home</button>
        </div>
    `);
}

public goHome = () => {
    page('/');
}
```

## Analytics Tracking Middleware

Middleware for tracking page views and events:

```typescript
// middlewares/analyticsMiddleware.ts
export function analyticsMiddleware(
    context: PageJS.Context,
    next: () => void
): void {
    // Track page view
    trackPageView(context.path);

    // Continue to next middleware or route handler
    next();
}

// Helper function to track page views
function trackPageView(path: string): void {
    // Example implementation for Google Analytics
    if (typeof window.gtag === 'function') {
        window.gtag('config', 'UA-XXXXXXXX-X', {
            page_path: path,
        });
    }

    // Example implementation for custom analytics
    console.log(`[Analytics] Page view: ${path}`);
}

// Helper function to track events
export function trackEvent(
    category: string,
    action: string,
    label?: string,
    value?: number
): void {
    // Example implementation for Google Analytics
    if (typeof window.gtag === 'function') {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }

    // Example implementation for custom analytics
    console.log(
        `[Analytics] Event: ${category} / ${action} / ${label || ''} / ${value || ''}`
    );
}

// Usage in routes.ts
import { analyticsMiddleware } from '../middlewares/analyticsMiddleware';

export const globalMiddleware = [
    analyticsMiddleware,
    // Other global middleware...
];

// Usage in a view model
import { trackEvent } from '../middlewares/analyticsMiddleware';

export class ProductViewModel extends BaseViewModel {
    // ...

    public addToCart = () => {
        // Add product to cart
        cartService.addItem(this.productId(), this.quantity());

        // Track the event
        trackEvent(
            'Ecommerce',
            'Add to Cart',
            this.productName(),
            this.price()
        );
    };
}
```

## Caching Middleware

Middleware for caching API responses:

```typescript
// middlewares/cacheMiddleware.ts
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

class CacheService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds

    public get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        const now = Date.now();
        if (now - entry.timestamp > this.defaultTTL) {
            // Entry has expired
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    public set<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    public clear(): void {
        this.cache.clear();
    }
}

// Singleton cache service
const cacheService = new CacheService();

// Middleware factory for caching API responses
export function withCache<T>(
    dataLoader: (context: PageJS.Context) => Promise<T>,
    getCacheKey: (context: PageJS.Context) => string,
    dataKey: string = 'data'
) {
    return function (context: PageJS.Context, next: () => void): void {
        const cacheKey = getCacheKey(context);
        const cachedData = cacheService.get<T>(cacheKey);

        if (cachedData) {
            // Use cached data
            console.log(`[Cache] Using cached data for: ${cacheKey}`);
            context.state[dataKey] = cachedData;
            next();
            return;
        }

        // No cached data, load from source
        console.log(`[Cache] Loading fresh data for: ${cacheKey}`);
        context.state.isLoading = true;

        dataLoader(context)
            .then((data) => {
                // Store in cache
                cacheService.set(cacheKey, data);

                // Store in context
                context.state[dataKey] = data;
                context.state.isLoading = false;
                next();
            })
            .catch((error) => {
                console.error(`Failed to load ${dataKey}:`, error);
                context.state.error = error;
                context.state.isLoading = false;
                next();
            });
    };
}

// Usage in routes.ts
import { withCache } from '../middlewares/cacheMiddleware';
import { loadProductData } from '../services/productService';

export const routes = [
    // Product details with cached data loading
    {
        path: '/product/:id',
        middleware: [
            withCache(
                (context) => loadProductData(context.params.id),
                (context) => `product_${context.params.id}`,
                'productData'
            ),
        ],
        handler: (context) => renderView(ProductViewModel, context),
    },
];
```

## Combining Multiple Middleware

Example of combining multiple middleware for a complex route:

```typescript
// routes.ts
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';
import { withCache } from '../middlewares/cacheMiddleware';
import { analyticsMiddleware } from '../middlewares/analyticsMiddleware';
import { errorHandlingMiddleware } from '../middlewares/errorHandlingMiddleware';
import { loadUserData } from '../services/userService';

// Global middleware applied to all routes
export const globalMiddleware = [errorHandlingMiddleware, analyticsMiddleware];

export const routes = [
    // Complex route with multiple middleware
    {
        path: '/admin/user/:id',
        middleware: [
            // Check authentication
            authMiddleware,

            // Check authorization
            requireRole('admin'),

            // Load user data with caching
            withCache(
                (context) => loadUserData(context.params.id),
                (context) => `admin_user_${context.params.id}`,
                'userData'
            ),

            // Custom middleware for this route
            (context, next) => {
                console.log(`Admin viewing user: ${context.params.id}`);

                // Add audit log
                auditService.log({
                    action: 'view_user',
                    userId: context.params.id,
                    adminId: getCurrentUser().id,
                    timestamp: new Date(),
                });

                next();
            },
        ],
        handler: (context) => renderView(AdminUserViewModel, context),
    },
];
```

These examples demonstrate various middleware patterns and usage for the Knockout Page Vite application. You can use these patterns as starting points for your own middleware implementations, combining and adapting them as needed for your specific requirements.
