import { applyBindings, cleanNode, dataFor } from 'knockout';

export class BaseViewModel {
    protected template?: string;
    protected context: PageJS.Context | undefined;
    protected selector: string | null = null;
    protected isSubTemplate = false;
    protected templateName: string;
    protected isDestroyed = false;

    constructor(context: PageJS.Context | undefined = undefined) {
        this.context = context;
        this.templateName = this.constructor.name;
    }

    /**
     * Renders the view into the specified container.
     * @param selector - The container's ID or selector where the view should be rendered.
     * @param context - The application context to use during rendering.
     * @returns The instance of BaseViewModel to allow method chaining.
     * @throws {Error} If the template is not set before rendering.
     */
    public render(
        selector = 'app',
        context: PageJS.Context | undefined = undefined
    ): this {
        if (this.isDestroyed) {
            console.warn(
                'Attempting to render a destroyed view model. Creating fresh bindings.'
            );
            this.isDestroyed = false;
        }

        if (!this.template) {
            throw new Error(
                'Template must be set before rendering. Use setTemplate() first.'
            );
        }

        this.selector = selector;
        this.setContext(context);
        this.loadTemplate(selector);
        return this;
    }

    /**
     * Sets the template and renders it in the specified container.
     * @param template - The template HTML to render.
     * @param context - The application context to use during rendering.
     * @param selector - The container's ID or selector where the template should be rendered.
     * @returns The instance of BaseViewModel to allow method chaining.
     */
    public renderTemplate(
        template: string,
        context: PageJS.Context | undefined = undefined,
        selector = 'app'
    ): this {
        return this.setTemplate(template).render(selector, context);
    }

    /**
     * Destroys the view by cleaning up bindings and removing child elements from the container.
     */
    public destroy(): void {
        if (this.isDestroyed) return;

        if (!this.selector) {
            console.error(
                'Selector is not defined. Unable to destroy the view.'
            );
            return;
        }

        const element = document.getElementById(this.selector);
        if (element) {
            cleanNode(element);
            element.innerHTML = '';
            this.isDestroyed = true;
        } else {
            console.error(`Element with ID "${this.selector}" not found.`);
        }
    }

    /**
     * Sets the context for the view.
     * @param context - The application context.
     * @returns The instance of BaseViewModel to allow method chaining.
     */
    public setContext(context: PageJS.Context | undefined): this {
        this.context = context;
        return this;
    }

    /**
     * Gets the current context of the view.
     */
    public getContext(): PageJS.Context | undefined {
        return this.context;
    }

    /**
     * Sets the template for the view.
     * @param template - The template HTML.
     * @returns The instance of BaseViewModel to allow method chaining.
     */
    public setTemplate(template: string): this {
        this.template = template;
        this.injectTemplateScript();
        return this;
    }

    /**
     * Called after the template has been rendered into the container.
     * Can be overridden by subclasses for custom behavior.
     */
    protected onTemplateRendered(): void {
        // Optional hook for subclasses
    }

    /**
     * Loads the template into the specified container and applies Knockout bindings.
     * @param selector - The container's ID or selector where the template should be rendered.
     * @throws {Error} If the container cannot be found or created.
     */
    private loadTemplate(selector: string): void {
        if (!this.template) {
            throw new Error('Template is not set. Call setTemplate() first.');
        }

        const container = this.getOrCreateContainer(selector);
        this.initializeContainer(container);
    }

    /**
     * Gets or creates the container element for the view.
     * @param selector - The container's ID or selector.
     * @returns The container HTMLElement.
     * @throws {Error} If the container cannot be created.
     */
    protected getOrCreateContainer(selector: string): HTMLElement {
        let container = document.getElementById(selector);

        if (!container) {
            container = document.createElement('div');
            container.id = selector;

            if (!document.body) {
                throw new Error(
                    'Document body not available. Cannot create container.'
                );
            }

            document.body.appendChild(container);
        }

        return container;
    }

    /**
     * Initializes the container with the template and bindings.
     * @param container - The container element to initialize.
     */
    protected initializeContainer(container: HTMLElement): void {
        cleanNode(container);
        container.innerHTML = this.template || '';
        applyBindings(this, container);
        this.onTemplateRendered();
    }

    /**
     * Renders the template to an HTML string without attaching to the DOM.
     * @returns The rendered HTML as a string.
     */
    public renderHtml(): string {
        if (!this.template) {
            console.warn('Template is not set. Returning empty string.');
            return '';
        }

        const container = document.createElement('div');
        this.initializeContainer(container);
        this.isSubTemplate = true;
        return container.innerHTML;
    }

    /**
     * Injects the template as a script element for Knockout templating.
     */
    protected injectTemplateScript(): void {
        if (!this.template) return;

        // Check if a script with the same templateName already exists
        if (document.getElementById(this.templateName)) {
            console.warn(
                `Template with id '${this.templateName}' already exists.`
            );
            return;
        }

        const scriptElement = document.createElement('script');
        scriptElement.type = 'text/html';
        scriptElement.id = this.templateName;
        scriptElement.innerHTML = this.template;
        document.body.appendChild(scriptElement);
    }

    /**
     * Generates the HTML for a script template element.
     * @returns The HTML string for the script template.
     */
    public buildTemplateScript(): string {
        return this.template
            ? `<script type="text/html" id="${this.templateName}">${this.template}</script>`
            : '';
    }
}

/**
 * Renders a given ViewModel into the DOM.
 * @param ViewModel - The constructor for the ViewModel class.
 * @param context - The application context to pass to the ViewModel.
 * @param selector - The container selector to render into.
 * @returns The created ViewModel instance.
 */
export const renderView = (
    ViewModel: new (context?: PageJS.Context) => BaseViewModel,
    context?: PageJS.Context,
    selector = 'app'
): BaseViewModel => {
    const viewModel = new ViewModel(context);
    viewModel.render(selector, context);
    return viewModel;
};

/**
 * Retrieves the Knockout observable data linked to a DOM element.
 * @param selector - The selector of the element to retrieve data from.
 * @returns The associated observable data or undefined if the element is not found.
 */
export const getViewModelFromElement = (selector: string): unknown => {
    const element = document.querySelector(selector);
    return element ? dataFor(element) : undefined;
};
