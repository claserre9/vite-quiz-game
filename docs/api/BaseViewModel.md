# BaseViewModel API Documentation

The `BaseViewModel` class is the core building block of the Knockout Page Vite application framework. It provides the foundation for creating view models that can be rendered to the DOM and bound with Knockout.js.

## Class Overview

`BaseViewModel` handles the lifecycle of views, including template management, rendering, and cleanup. It serves as the base class for all view models in the application.

## Constructor

```typescript
constructor(context: PageJS.Context | undefined = undefined)
```

**Parameters:**

- `context` (optional): The PageJS.Context object that contains routing information.

## Properties

| Property        | Type                          | Description                                            |
| --------------- | ----------------------------- | ------------------------------------------------------ | ------------------------------- |
| `template`      | `string                       | undefined`                                             | The HTML template for the view. |
| `context`       | `PageJS.Context \| undefined` | The current routing context.                           |
| `selector`      | `string \| null`              | The DOM selector where the view is rendered.           |
| `isSubTemplate` | `boolean`                     | Indicates if this is a sub-template.                   |
| `templateName`  | `string`                      | The name of the template (defaults to the class name). |
| `isDestroyed`   | `boolean`                     | Indicates if the view has been destroyed.              |

## Methods

### render

```typescript
public render(selector = "app", context: PageJS.Context | undefined = undefined): this
```

Renders the view into the specified container.

**Parameters:**

- `selector` (optional): The container's ID or selector where the view should be rendered. Defaults to "app".
- `context` (optional): The application context to use during rendering.

**Returns:** The instance of BaseViewModel to allow method chaining.

**Throws:** Error if the template is not set before rendering.

### renderTemplate

```typescript
public renderTemplate(template: string, context: PageJS.Context | undefined = undefined, selector = "app"): this
```

Sets the template and renders it in the specified container.

**Parameters:**

- `template`: The template HTML to render.
- `context` (optional): The application context to use during rendering.
- `selector` (optional): The container's ID or selector where the template should be rendered. Defaults to "app".

**Returns:** The instance of BaseViewModel to allow method chaining.

### destroy

```typescript
public destroy(): void
```

Destroys the view by cleaning up bindings and removing child elements from the container.

### setContext

```typescript
public setContext(context: PageJS.Context | undefined): this
```

Sets the context for the view.

**Parameters:**

- `context`: The application context.

**Returns:** The instance of BaseViewModel to allow method chaining.

### getContext

```typescript
public getContext(): PageJS.Context | undefined
```

Gets the current context of the view.

**Returns:** The current PageJS.Context or undefined.

### setTemplate

```typescript
public setTemplate(template: string): this
```

Sets the template for the view.

**Parameters:**

- `template`: The template HTML.

**Returns:** The instance of BaseViewModel to allow method chaining.

### renderHtml

```typescript
public renderHtml(): string
```

Renders the template to an HTML string without attaching to the DOM.

**Returns:** The rendered HTML as a string.

### buildTemplateScript

```typescript
public buildTemplateScript(): string
```

Generates the HTML for a script template element.

**Returns:** The HTML string for the script template.

## Protected Methods

### onTemplateRendered

```typescript
protected onTemplateRendered(): void
```

Called after the template has been rendered into the container. Can be overridden by subclasses for custom behavior.

### getOrCreateContainer

```typescript
protected getOrCreateContainer(selector: string): HTMLElement
```

Gets or creates the container element for the view.

**Parameters:**

- `selector`: The container's ID or selector.

**Returns:** The container HTMLElement.

**Throws:** Error if the container cannot be created.

### initializeContainer

```typescript
protected initializeContainer(container: HTMLElement): void
```

Initializes the container with the template and bindings.

**Parameters:**

- `container`: The container element to initialize.

### injectTemplateScript

```typescript
protected injectTemplateScript(): void
```

Injects the template as a script element for Knockout templating.

## Helper Functions

### renderView

```typescript
export const renderView = (
    ViewModel: new (context?: PageJS.Context) => BaseViewModel,
    context?: PageJS.Context,
    selector = "app"
): BaseViewModel
```

Renders a given ViewModel into the DOM.

**Parameters:**

- `ViewModel`: The constructor for the ViewModel class.
- `context` (optional): The application context to pass to the ViewModel.
- `selector` (optional): The container selector to render into. Defaults to "app".

**Returns:** The created ViewModel instance.

### getViewModelFromElement

```typescript
export const getViewModelFromElement = (selector: string): unknown
```

Retrieves the Knockout observable data linked to a DOM element.

**Parameters:**

- `selector`: The selector of the element to retrieve data from.

**Returns:** The associated observable data or undefined if the element is not found.
