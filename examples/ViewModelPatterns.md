# View Model Patterns

This document provides examples of common patterns for creating and using view models in the Knockout Page Vite application.

## Basic View Model

The simplest view model extends `BaseViewModel` and sets a template:

```typescript
import { BaseViewModel } from '../core/BaseViewModel';

export class SimpleViewModel extends BaseViewModel {
    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`
            <div class="simple-view">
                <h1>Simple View</h1>
                <p>This is a simple view model example.</p>
            </div>
        `);
    }
}
```

## View Model with Observable Properties

Using Knockout observables for reactive data:

```typescript
import { BaseViewModel } from '../core/BaseViewModel';
import * as ko from 'knockout';

export class CounterViewModel extends BaseViewModel {
    // Observable properties
    public count = ko.observable(0);
    public message = ko.computed(() => `Current count: ${this.count()}`);

    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`
            <div class="counter-view">
                <h1>Counter Example</h1>
                <p data-bind="text: message"></p>
                <button data-bind="click: increment">Increment</button>
                <button data-bind="click: decrement">Decrement</button>
            </div>
        `);
    }

    // Methods bound to UI events
    public increment = () => {
        this.count(this.count() + 1);
    };

    public decrement = () => {
        this.count(this.count() - 1);
    };
}
```

## View Model with Route Parameters

Accessing route parameters from the context:

```typescript
import { BaseViewModel } from '../core/BaseViewModel';
import * as ko from 'knockout';

export class UserViewModel extends BaseViewModel {
    public userId = ko.observable<string>('');
    public userDetails = ko.observable<any>(null);
    public isLoading = ko.observable<boolean>(true);

    constructor(context: PageJS.Context | undefined) {
        super(context);

        // Extract user ID from route parameters
        if (context && context.params.id) {
            this.userId(context.params.id);
            this.loadUserData(context.params.id);
        }

        this.setTemplate(`
            <div class="user-view">
                <h1>User Details</h1>
                
                <!-- Loading state -->
                <div data-bind="visible: isLoading">
                    Loading user data...
                </div>
                
                <!-- User details -->
                <div data-bind="visible: !isLoading() && userDetails()">
                    <p>User ID: <span data-bind="text: userId"></span></p>
                    <p>Name: <span data-bind="text: userDetails() ? userDetails().name : ''"></span></p>
                    <p>Email: <span data-bind="text: userDetails() ? userDetails().email : ''"></span></p>
                </div>
                
                <!-- Error state -->
                <div data-bind="visible: !isLoading() && !userDetails()">
                    User not found or error loading data.
                </div>
            </div>
        `);
    }

    private loadUserData(userId: string): void {
        // Simulate API call
        setTimeout(() => {
            // Mock user data (in a real app, this would come from an API)
            if (userId === '123') {
                this.userDetails({
                    id: userId,
                    name: 'John Doe',
                    email: 'john.doe@example.com',
                });
            } else {
                this.userDetails(null); // User not found
            }

            this.isLoading(false);
        }, 1000);
    }
}
```

## View Model with Form Handling

Handling form input and submission:

```typescript
import { BaseViewModel } from '../core/BaseViewModel';
import * as ko from 'knockout';

export class ContactFormViewModel extends BaseViewModel {
    // Form fields
    public name = ko.observable<string>('');
    public email = ko.observable<string>('');
    public message = ko.observable<string>('');

    // Form state
    public isSubmitting = ko.observable<boolean>(false);
    public isSubmitted = ko.observable<boolean>(false);
    public errors = ko.observableArray<string>([]);

    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`
            <div class="contact-form">
                <h1>Contact Us</h1>
                
                <!-- Success message -->
                <div class="success-message" data-bind="visible: isSubmitted">
                    Thank you for your message! We'll get back to you soon.
                </div>
                
                <!-- Form -->
                <form data-bind="visible: !isSubmitted(), submit: submitForm">
                    <!-- Error messages -->
                    <div class="error-messages" data-bind="visible: errors().length > 0">
                        <ul data-bind="foreach: errors">
                            <li data-bind="text: $data"></li>
                        </ul>
                    </div>
                    
                    <div class="form-group">
                        <label for="name">Name:</label>
                        <input id="name" type="text" data-bind="value: name, disable: isSubmitting" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input id="email" type="email" data-bind="value: email, disable: isSubmitting" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="message">Message:</label>
                        <textarea id="message" data-bind="value: message, disable: isSubmitting" required></textarea>
                    </div>
                    
                    <button type="submit" data-bind="disable: isSubmitting">
                        <span data-bind="visible: !isSubmitting()">Send Message</span>
                        <span data-bind="visible: isSubmitting">Sending...</span>
                    </button>
                </form>
            </div>
        `);
    }

    public submitForm = (): void => {
        // Reset errors
        this.errors([]);

        // Validate form
        if (!this.name()) {
            this.errors.push('Name is required');
        }

        if (!this.email()) {
            this.errors.push('Email is required');
        } else if (!this.isValidEmail(this.email())) {
            this.errors.push('Please enter a valid email address');
        }

        if (!this.message()) {
            this.errors.push('Message is required');
        }

        // If there are errors, don't submit
        if (this.errors().length > 0) {
            return;
        }

        // Submit form
        this.isSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            // In a real app, you would send the data to a server here
            console.log('Form submitted:', {
                name: this.name(),
                email: this.email(),
                message: this.message(),
            });

            this.isSubmitting(false);
            this.isSubmitted(true);
        }, 1500);
    };

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
```

## View Model with Child Components

Creating a parent view model that contains child components:

```typescript
import { BaseViewModel } from '../core/BaseViewModel';
import * as ko from 'knockout';

// Child component view model
class TabViewModel extends BaseViewModel {
    public title: string;
    public content: string;
    public isActive = ko.observable<boolean>(false);

    constructor(title: string, content: string) {
        super();
        this.title = title;
        this.content = content;
        this.isSubTemplate = true; // Mark as sub-template
    }

    public activate(): void {
        this.isActive(true);
    }

    public deactivate(): void {
        this.isActive(false);
    }
}

// Parent view model
export class TabsViewModel extends BaseViewModel {
    public tabs: TabViewModel[] = [];
    public activeTab = ko.observable<TabViewModel | null>(null);

    constructor(context: PageJS.Context | undefined) {
        super(context);

        // Create tabs
        this.tabs = [
            new TabViewModel('Home', 'This is the home tab content.'),
            new TabViewModel('Profile', 'This is the profile tab content.'),
            new TabViewModel('Settings', 'This is the settings tab content.'),
        ];

        // Set initial active tab
        if (this.tabs.length > 0) {
            this.setActiveTab(this.tabs[0]);
        }

        this.setTemplate(`
            <div class="tabs-container">
                <h1>Tabs Example</h1>
                
                <!-- Tab navigation -->
                <ul class="tabs-nav">
                    <!-- ko foreach: tabs -->
                    <li data-bind="css: { active: isActive }, click: $parent.setActiveTab">
                        <span data-bind="text: title"></span>
                    </li>
                    <!-- /ko -->
                </ul>
                
                <!-- Tab content -->
                <div class="tab-content">
                    <!-- ko foreach: tabs -->
                    <div class="tab-pane" data-bind="visible: isActive">
                        <h2 data-bind="text: title"></h2>
                        <p data-bind="text: content"></p>
                    </div>
                    <!-- /ko -->
                </div>
            </div>
        `);
    }

    public setActiveTab = (tab: TabViewModel): void => {
        // Deactivate current tab
        if (this.activeTab()) {
            this.activeTab()!.deactivate();
        }

        // Activate new tab
        tab.activate();
        this.activeTab(tab);
    };
}
```

## View Model with Lifecycle Hooks

Implementing custom behavior for lifecycle events:

```typescript
import { BaseViewModel } from '../core/BaseViewModel';
import * as ko from 'knockout';

export class LifecycleViewModel extends BaseViewModel {
    public logs = ko.observableArray<string>([]);

    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.addLog('Constructor called');

        this.setTemplate(`
            <div class="lifecycle-demo">
                <h1>Lifecycle Hooks Demo</h1>
                <button data-bind="click: destroy">Destroy View</button>
                <button data-bind="click: recreate">Recreate View</button>
                
                <h2>Lifecycle Logs:</h2>
                <ul data-bind="foreach: logs">
                    <li data-bind="text: $data"></li>
                </ul>
            </div>
        `);
    }

    // Override onTemplateRendered hook
    protected onTemplateRendered(): void {
        this.addLog('onTemplateRendered called');

        // Set up any DOM-dependent initialization here
        this.addLog('View fully initialized');
    }

    // Custom method to recreate the view
    public recreate = (): void => {
        if (this.isDestroyed) {
            this.addLog('Recreating view');
            this.render('app');
        } else {
            this.addLog('View is already active');
        }
    };

    // Override destroy to add custom cleanup
    public destroy(): void {
        this.addLog('destroy called');

        // Perform any custom cleanup here

        // Call the parent destroy method
        super.destroy();

        this.addLog('View destroyed');
    }

    private addLog(message: string): void {
        const timestamp = new Date().toLocaleTimeString();
        this.logs.push(`[${timestamp}] ${message}`);
    }
}
```

These examples demonstrate various patterns for creating view models in the Knockout Page Vite application. You can use these patterns as starting points for your own view models, combining and adapting them as needed for your specific requirements.
