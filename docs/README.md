# Knockout Page Vite Documentation

Welcome to the documentation for the Knockout Page Vite application framework. This documentation will help you understand the architecture, API, and usage patterns of the framework.

## Quick Start Guide

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/knockout-page-vite.git
    cd knockout-page-vite
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the development server:

    ```bash
    npm run dev
    ```

4. Open your browser and navigate to `http://localhost:5173`

### Creating Your First View Model

1. Create a new file in the `src/components` directory:

    ```typescript
    // src/components/HelloWorldViewModel.ts
    import { BaseViewModel } from '../core/BaseViewModel';
    import * as ko from 'knockout';

    export class HelloWorldViewModel extends BaseViewModel {
        public message = ko.observable('Hello, World!');

        constructor(context: PageJS.Context | undefined) {
            super(context);
            this.setTemplate(`
                <div class="hello-world">
                    <h1 data-bind="text: message"></h1>
                    <button data-bind="click: changeMessage">Change Message</button>
                </div>
            `);
        }

        public changeMessage = (): void => {
            this.message('Hello, Knockout Page Vite!');
        };
    }
    ```

2. Add a route for your new view model in `src/routes/routes.ts`:

    ```typescript
    import { HelloWorldViewModel } from '../components/HelloWorldViewModel';

    export const routes = [
        // Existing routes...
        {
            path: '/hello',
            handler: (context) => renderView(HelloWorldViewModel, context),
        },
        // ...
    ];
    ```

3. Navigate to `/hello` in your browser to see your new view model in action.

## Documentation Sections

### API Documentation

- [BaseViewModel API](api/BaseViewModel.md) - Documentation for the core BaseViewModel class
- [Routing API](api/Routing.md) - Documentation for the routing system
- [Middleware API](api/Middleware.md) - Documentation for the middleware system

### Usage Examples

- [View Model Patterns](../examples/ViewModelPatterns.md) - Examples of common view model patterns
- [Routing Examples](../examples/RoutingExamples.md) - Examples of routing configurations
- [Middleware Examples](../examples/MiddlewareExamples.md) - Examples of middleware usage

### Architecture

- [Architecture Documentation](architecture/README.md) - Overview of the application architecture, component lifecycle, and design decisions

### Improvement Tasks

- [Tasks](tasks.md) - List of improvement tasks for the project

## Core Concepts

### View Models

View models are the core building blocks of the application. They extend the `BaseViewModel` class and provide:

- A template for rendering
- Observable properties for data binding
- Methods for handling user interactions

### Routing

The routing system is built on [page.js](https://github.com/visionmedia/page.js) and provides:

- Declarative route definitions
- Middleware support
- Parameter extraction
- Navigation control

### Middleware

Middleware functions can be used to:

- Intercept route navigation
- Perform authentication and authorization
- Load data
- Handle errors
- Track analytics

## Best Practices

### View Model Organization

- Keep view models focused on a single responsibility
- Use composition to build complex UIs
- Separate business logic from presentation logic

### State Management

- Use Knockout observables for reactive state
- Consider service singletons for shared state
- Use the route context to pass state between routes
- Persist global data using the built-in observable store in `src/store`

### Error Handling

- Use middleware for global error handling
- Handle component-specific errors in view models
- Provide user-friendly error messages

## Contributing

Please see the [CONTRIBUTING.md](../CONTRIBUTING.md) file for guidelines on how to contribute to the project.

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
