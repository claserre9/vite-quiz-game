# Architecture Documentation

This document describes the architecture of the Knockout Page Vite application, including the component lifecycle, routing flow, and state management approach.

## Overall Architecture

The Knockout Page Vite application is built on the following key technologies:

- **Knockout.js**: A MVVM (Model-View-ViewModel) framework for creating rich, responsive UIs with a clean underlying data model
- **Page.js**: A client-side routing library for single page applications
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript
- **Vite**: A modern frontend build tool that provides fast development experience

The application follows a component-based architecture where each view is represented by a view model that extends the `BaseViewModel` class. The application uses page.js for routing and Knockout.js for data binding.

## Core Components

### BaseViewModel

The `BaseViewModel` class is the foundation of the application's component system. It provides:

- Template management
- Rendering to the DOM
- Lifecycle management
- Context handling

All view models in the application extend this base class to inherit its functionality.

### Routing System

The routing system is built on page.js and provides:

- Declarative route definitions
- Middleware support
- Parameter extraction
- Navigation control

Routes are defined in a central configuration and registered with page.js at application startup.

### Middleware System

The middleware system allows for cross-cutting concerns to be handled separately from the route handlers. Middleware functions can:

- Intercept route navigation
- Perform authentication and authorization
- Load data
- Handle errors
- Track analytics

## Component Lifecycle

The lifecycle of a view model in the application follows these stages:

1. **Instantiation**: The view model is created with an optional context object.

    ```typescript
    const viewModel = new SomeViewModel(context);
    ```

2. **Template Setting**: The template HTML is set for the view model.

    ```typescript
    viewModel.setTemplate(`<div>...</div>`);
    ```

3. **Rendering**: The view model is rendered to the DOM.

    ```typescript
    viewModel.render('container-id', context);
    ```

4. **Post-Render Hook**: The `onTemplateRendered` method is called after rendering.

    ```typescript
    protected onTemplateRendered(): void {
        // Custom initialization after rendering
    }
    ```

5. **Destruction**: When navigating away or explicitly called, the view model is destroyed.
    ```typescript
    viewModel.destroy();
    ```

### Detailed Lifecycle Flow

1. When a route is matched, the route handler creates a new view model instance.
2. The view model's constructor sets up the initial state and template.
3. The `render` method is called, which:
    - Gets or creates the container element
    - Cleans any existing bindings
    - Injects the template
    - Applies Knockout bindings
    - Calls the `onTemplateRendered` hook
4. When navigating to a different route, the previous view model is destroyed:
    - Knockout bindings are cleaned
    - DOM elements are removed
    - The `isDestroyed` flag is set

## Routing and Navigation Flow

The routing and navigation flow in the application follows these steps:

1. **Route Definition**: Routes are defined in the `routes.ts` file.

    ```typescript
    export const routes = [
        {
            path: '/',
            handler: (context) => renderView(HomeViewModel, context),
        },
        // Other routes...
    ];
    ```

2. **Route Registration**: Routes are registered with page.js at application startup.

    ```typescript
    export const registerRoutes = (page) => {
        // Register global middleware
        globalMiddleware.forEach((middleware) => {
            page('*', middleware);
        });

        // Register routes
        routes.forEach((route) => {
            if (route.middleware && route.middleware.length > 0) {
                page(route.path, ...route.middleware, route.handler);
            } else {
                page(route.path, route.handler);
            }
        });

        // Start page.js
        page();
    };
    ```

3. **Route Matching**: When a URL is navigated to, page.js matches it against the registered routes.

4. **Middleware Execution**: If the route has middleware, they are executed in order.
    - Global middleware is executed first
    - Route-specific middleware is executed next

5. **Route Handler Execution**: After all middleware has completed, the route handler is executed.
    - The handler typically creates and renders a view model

6. **View Rendering**: The view model is rendered to the DOM.

7. **Navigation**: When a link is clicked or programmatic navigation occurs, the process starts again from step 3.

## State Management

The application uses Knockout's observable pattern for state management:

### Local Component State

Each view model maintains its own state using Knockout observables:

```typescript
export class CounterViewModel extends BaseViewModel {
    public count = ko.observable(0);
    public message = ko.computed(() => `Current count: ${this.count()}`);

    // Methods to update state
    public increment = () => {
        this.count(this.count() + 1);
    };
}
```

### Shared State

For shared state between components, the application can use several approaches:

1. **Service Singletons**: Shared services that maintain state:

    ```typescript
    // userService.ts
    export class UserService {
        public currentUser = ko.observable(null);

        public login(username, password) {
            // Authentication logic
            this.currentUser({ username /* other user data */ });
        }

        public logout() {
            this.currentUser(null);
        }
    }

    // Singleton instance
    export const userService = new UserService();
    ```

2. **Route Context**: Passing state through the route context:

    ```typescript
    // In middleware
    function loadUserData(context, next) {
        context.state.userData = fetchUserData();
        next();
    }

    // In view model
    constructor(context) {
        super(context);
        if (context && context.state.userData) {
            this.userData(context.state.userData);
        }
    }
    ```

3. **Local Storage**: Persisting state in localStorage:

    ```typescript
    // Save state
    localStorage.setItem('user', JSON.stringify(user));

    // Load state
    const user = JSON.parse(localStorage.getItem('user'));
    ```

### Centralized Store

A lightweight observable store is provided in `src/store`. It keeps global
application state in a single Knockout observable and automatically persists
changes to `localStorage` by default. Derived state can be defined using the
store's `computed` helper:

```typescript
import { appStore, isAuthenticated } from '@store/AppStore';

// Access or update state
appStore.setState({ authToken: 'demo' });

// Derived value
if (isAuthenticated()) {
    // user is logged in
}
```

## Data Flow

The data flow in the application follows these patterns:

1. **One-way Binding**: Data flows from the view model to the view:

    ```html
    <div data-bind="text: message"></div>
    ```

2. **Two-way Binding**: Data flows in both directions:

    ```html
    <input data-bind="value: name, valueUpdate: 'afterkeydown'" />
    ```

3. **Event Binding**: User interactions trigger methods on the view model:

    ```html
    <button data-bind="click: increment">Increment</button>
    ```

4. **Computed Properties**: Derived state is calculated from other observables:
    ```typescript
    this.fullName = ko.computed(() => `${this.firstName()} ${this.lastName()}`);
    ```

## Error Handling

The application handles errors at several levels:

1. **Route Level**: Using error handling middleware:

    ```typescript
    function errorHandlingMiddleware(context, next) {
        try {
            next();
        } catch (error) {
            console.error('Route error:', error);
            page.redirect('/error');
        }
    }
    ```

2. **Component Level**: Using try/catch in view model methods:

    ```typescript
    public saveData = () => {
        try {
            // Save data
        } catch (error) {
            this.error(error.message);
        }
    }
    ```

3. **Global Level**: Using window.onerror or unhandledrejection:
    ```typescript
    window.onerror = function (message, source, lineno, colno, error) {
        console.error('Global error:', error);
        // Handle error
    };
    ```

## Architecture Decisions

### Why Knockout.js?

Knockout.js was chosen for this project because:

1. **Declarative Bindings**: Knockout's declarative binding syntax makes it easy to connect the UI with the view model.
2. **Observable Pattern**: The observable pattern provides a clean way to handle reactive data.
3. **Lightweight**: Knockout is a lightweight library that focuses on the MVVM pattern.
4. **Maturity**: Knockout is a mature library with a stable API.

### Why Page.js?

Page.js was chosen for routing because:

1. **Simplicity**: Page.js has a simple API that is easy to understand and use.
2. **Middleware Support**: The middleware pattern allows for separation of concerns.
3. **Express-like Syntax**: The syntax is similar to Express.js, making it familiar to many developers.
4. **Small Size**: Page.js is a small library with minimal overhead.

### Why TypeScript?

TypeScript was chosen for the project because:

1. **Type Safety**: TypeScript provides compile-time type checking, reducing runtime errors.
2. **IDE Support**: TypeScript has excellent IDE support, providing better autocompletion and refactoring tools.
3. **Modern JavaScript Features**: TypeScript allows using modern JavaScript features while maintaining compatibility with older browsers.
4. **Better Documentation**: Types serve as documentation, making the code more self-documenting.

### Why Vite?

Vite was chosen as the build tool because:

1. **Fast Development**: Vite provides a fast development experience with instant server start and hot module replacement.
2. **ES Modules**: Vite leverages native ES modules for development, avoiding the need for bundling during development.
3. **Optimized Production Build**: Vite uses Rollup for production builds, resulting in optimized bundles.
4. **Plugin Ecosystem**: Vite has a growing ecosystem of plugins for various use cases.

## Future Architecture Considerations

As the application grows, the following architectural improvements could be considered:

1. **State Management Library**: For more complex applications, a dedicated state management library like Redux or MobX could be integrated.
2. **Component Library**: A component library could be developed to provide reusable UI components.
3. **API Layer**: A dedicated API layer could be added to handle communication with backend services.
4. **Code Splitting**: More aggressive code splitting could be implemented to reduce initial load times.
5. **Server-Side Rendering**: For improved SEO and initial load performance, server-side rendering could be added.

These considerations would depend on the specific needs and growth of the application.
