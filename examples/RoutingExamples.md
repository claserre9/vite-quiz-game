# Routing Examples

This document provides examples of common routing patterns and configurations for the Knockout Page Vite application.

## Basic Routes

The simplest routing configuration with basic routes:

```typescript
import { renderView } from '../core/BaseViewModel';
import { HomeViewModel } from '../components/HomeViewModel';
import { AboutViewModel } from '../components/AboutViewModel';
import { ContactViewModel } from '../components/ContactViewModel';
import { NotFoundViewModel } from '../components/NotFoundViewModel';

export const routes = [
    {
        path: '/',
        handler: (context) => renderView(HomeViewModel, context),
    },
    {
        path: '/about',
        handler: (context) => renderView(AboutViewModel, context),
    },
    {
        path: '/contact',
        handler: (context) => renderView(ContactViewModel, context),
    },
    {
        // Catch-all route for 404 pages
        path: '*',
        handler: () => renderView(NotFoundViewModel),
    },
];

export const registerRoutes = (page) => {
    // Register all routes
    routes.forEach((route) => {
        page(route.path, route.handler);
    });

    // Start page.js
    page();
};
```

## Routes with Parameters

Using route parameters to pass data to view models:

```typescript
import { renderView } from "../core/BaseViewModel";
import { HomeViewModel } from "../components/HomeViewModel";
import { UserViewModel } from "../components/UserViewModel";
import { ProductViewModel } from "../components/ProductViewModel";
import { NotFoundViewModel } from "../components/NotFoundViewModel";

export const routes = [
    {
        path: "/",
        handler: (context) => renderView(HomeViewModel, context)
    },
    {
        path: "/user/:id",
        handler: (context) => renderView(UserViewModel, context)
    },
    {
        path: "/product/:category/:id",
        handler: (context) => renderView(ProductViewModel, context)
    },
    {
        // Catch-all route for 404 pages
        path: "*",
        handler: () => renderView(NotFoundViewModel)
    }
];

// In UserViewModel.ts
constructor(context: PageJS.Context | undefined) {
    super(context);

    // Extract user ID from route parameters
    if (context && context.params.id) {
        this.userId = context.params.id;
        this.loadUserData(this.userId);
    }

    // Set template...
}

// In ProductViewModel.ts
constructor(context: PageJS.Context | undefined) {
    super(context);

    // Extract product category and ID from route parameters
    if (context && context.params.category && context.params.id) {
        this.category = context.params.category;
        this.productId = context.params.id;
        this.loadProductData(this.category, this.productId);
    }

    // Set template...
}
```

## Routes with Query Parameters

Handling query parameters in routes:

```typescript
import { renderView } from "../core/BaseViewModel";
import { SearchViewModel } from "../components/SearchViewModel";

export const routes = [
    // Other routes...
    {
        path: "/search",
        handler: (context) => renderView(SearchViewModel, context)
    }
];

// In SearchViewModel.ts
constructor(context: PageJS.Context | undefined) {
    super(context);

    // Extract query parameters
    if (context && context.querystring) {
        const params = new URLSearchParams(context.querystring);

        this.query = params.get('q') || '';
        this.page = parseInt(params.get('page') || '1', 10);
        this.sortBy = params.get('sort') || 'relevance';

        this.performSearch();
    }

    // Set template...
}

// Navigate to search with query parameters
page('/search?q=example&page=2&sort=date');
```

## Routes with Middleware

Using middleware for authentication, logging, and data loading:

```typescript
import { renderView } from '../core/BaseViewModel';
import { HomeViewModel } from '../components/HomeViewModel';
import { AdminViewModel } from '../components/AdminViewModel';
import { LoginViewModel } from '../components/LoginViewModel';
import { NotFoundViewModel } from '../components/NotFoundViewModel';

// Authentication middleware
function authMiddleware(context, next) {
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

// Logging middleware
function logMiddleware(context, next) {
    console.log(`Navigating to: ${context.path}`);
    next();
}

// Data loading middleware
function loadUserDataMiddleware(context, next) {
    // Fetch user data if authenticated
    const authToken = localStorage.getItem('auth_token');

    if (authToken) {
        // Simulate API call to get user data
        setTimeout(() => {
            context.state.userData = {
                name: 'John Doe',
                role: 'admin',
            };
            next();
        }, 100);
    } else {
        next();
    }
}

// Global middleware applied to all routes
export const globalMiddleware = [logMiddleware];

export const routes = [
    {
        path: '/',
        handler: (context) => renderView(HomeViewModel, context),
    },
    {
        path: '/admin',
        middleware: [authMiddleware],
        handler: (context) => renderView(AdminViewModel, context),
    },
    {
        path: '/profile',
        middleware: [authMiddleware, loadUserDataMiddleware],
        handler: (context) => renderView(ProfileViewModel, context),
    },
    {
        path: '/login',
        handler: (context) => renderView(LoginViewModel, context),
    },
    {
        // Catch-all route for 404 pages
        path: '*',
        handler: () => renderView(NotFoundViewModel),
    },
];

export const registerRoutes = (page) => {
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

## Nested Routes

Implementing nested routes with shared layouts:

```typescript
import { renderView } from '../core/BaseViewModel';
import { DashboardViewModel } from '../components/DashboardViewModel';
import { DashboardHomeViewModel } from '../components/DashboardHomeViewModel';
import { DashboardProfileViewModel } from '../components/DashboardProfileViewModel';
import { DashboardSettingsViewModel } from '../components/DashboardSettingsViewModel';

// Dashboard layout middleware
function dashboardLayoutMiddleware(context, next) {
    // Render the dashboard layout first
    const dashboardLayout = renderView(DashboardViewModel, context);

    // Store the layout in context for child routes to use
    context.state.layout = dashboardLayout;

    next();
}

export const routes = [
    // Other routes...

    // Dashboard routes
    {
        path: '/dashboard',
        middleware: [authMiddleware, dashboardLayoutMiddleware],
        handler: (context) => {
            // The layout is already rendered by the middleware
            // Now render the dashboard home content in the content area
            const layout = context.state.layout;
            layout.renderContent(DashboardHomeViewModel, context);
        },
    },
    {
        path: '/dashboard/profile',
        middleware: [authMiddleware, dashboardLayoutMiddleware],
        handler: (context) => {
            const layout = context.state.layout;
            layout.renderContent(DashboardProfileViewModel, context);
        },
    },
    {
        path: '/dashboard/settings',
        middleware: [authMiddleware, dashboardLayoutMiddleware],
        handler: (context) => {
            const layout = context.state.layout;
            layout.renderContent(DashboardSettingsViewModel, context);
        },
    },
];

// In DashboardViewModel.ts
export class DashboardViewModel extends BaseViewModel {
    private contentContainer: string = 'dashboard-content';

    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`
            <div class="dashboard-layout">
                <div class="dashboard-sidebar">
                    <h2>Dashboard</h2>
                    <nav>
                        <ul>
                            <li><a href="/dashboard">Home</a></li>
                            <li><a href="/dashboard/profile">Profile</a></li>
                            <li><a href="/dashboard/settings">Settings</a></li>
                        </ul>
                    </nav>
                </div>
                <div class="dashboard-main">
                    <div id="${this.contentContainer}"></div>
                </div>
            </div>
        `);
    }

    public renderContent(
        ViewModel: new (context?: PageJS.Context) => BaseViewModel,
        context?: PageJS.Context
    ): BaseViewModel {
        return renderView(ViewModel, context, this.contentContainer);
    }
}
```

## Route Guards

Implementing route guards for access control:

```typescript
// Role-based authorization guard
function roleGuard(requiredRole) {
    return function (context, next) {
        const user = getUserFromLocalStorage();

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

// Confirmation guard for destructive actions
function confirmationGuard(message) {
    return function (context, next) {
        if (confirm(message)) {
            // User confirmed, proceed
            next();
        } else {
            // User cancelled, go back to previous page
            window.history.back();
        }
    };
}

export const routes = [
    // Other routes...

    // Admin routes with role guard
    {
        path: '/admin',
        middleware: [authMiddleware, roleGuard('admin')],
        handler: (context) => renderView(AdminViewModel, context),
    },

    // Moderator routes with role guard
    {
        path: '/moderator',
        middleware: [authMiddleware, roleGuard('moderator')],
        handler: (context) => renderView(ModeratorViewModel, context),
    },

    // Destructive action with confirmation guard
    {
        path: '/delete-account',
        middleware: [
            authMiddleware,
            confirmationGuard(
                'Are you sure you want to delete your account? This action cannot be undone.'
            ),
        ],
        handler: (context) => renderView(DeleteAccountViewModel, context),
    },

    // Access denied page
    {
        path: '/access-denied',
        handler: (context) => renderView(AccessDeniedViewModel, context),
    },
];
```

## Programmatic Navigation

Examples of programmatic navigation:

```typescript
// Simple navigation
function goToHomePage() {
    page('/');
}

// Navigation with parameters
function viewUserProfile(userId) {
    page(`/user/${userId}`);
}

// Navigation with query parameters
function searchProducts(query, filters) {
    const queryParams = new URLSearchParams();
    queryParams.set('q', query);

    // Add filters to query parameters
    Object.entries(filters).forEach(([key, value]) => {
        queryParams.set(key, value);
    });

    page(`/search?${queryParams.toString()}`);
}

// Redirect (replaces current history entry)
function redirectToLogin() {
    page.redirect('/login');
}

// Example usage in a view model
export class ProductListViewModel extends BaseViewModel {
    // ...

    public viewProductDetails = (productId) => {
        page(`/product/${productId}`);
    };

    public applyFilters = () => {
        const filters = {
            category: this.selectedCategory(),
            minPrice: this.minPrice(),
            maxPrice: this.maxPrice(),
            sort: this.sortOrder(),
        };

        searchProducts(this.searchQuery(), filters);
    };
}
```

These examples demonstrate various routing patterns and configurations for the Knockout Page Vite application. You can use these patterns as starting points for your own routing setup, combining and adapting them as needed for your specific requirements.
