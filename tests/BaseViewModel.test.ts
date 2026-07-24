import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { observable } from 'knockout';
import { BaseViewModel } from '@core/BaseViewModel.ts';

class GreetingViewModel extends BaseViewModel {
    public message = observable('Hello');

    constructor() {
        super(undefined);
        this.setTemplate('<span data-bind="text: message"></span>');
    }
}

class SubscribingViewModel extends BaseViewModel {
    public counter = observable(0);
    public fireCount = 0;

    constructor() {
        super(undefined);
        this.registerSubscription(
            this.counter.subscribe(() => {
                this.fireCount++;
            })
        );
        this.setTemplate('<div>subscribing</div>');
    }
}

const SELECTOR = 'test-app';

function cleanupContainer() {
    document.getElementById(SELECTOR)?.remove();
}

describe('BaseViewModel', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    afterEach(() => {
        cleanupContainer();
    });

    it('throws if rendered before a template is set', () => {
        const vm = new (class extends BaseViewModel {})();
        expect(() => vm.render(SELECTOR)).toThrow(
            /Template must be set before rendering/
        );
    });

    it('renders the template into the container and applies bindings', () => {
        const vm = new GreetingViewModel();
        vm.render(SELECTOR);

        const container = document.getElementById(SELECTOR)!;
        expect(container.textContent).toBe('Hello');

        vm.message('Bonjour');
        expect(container.textContent).toBe('Bonjour');
    });

    it('creates the container under document.body if it does not exist', () => {
        expect(document.getElementById(SELECTOR)).toBeNull();
        new GreetingViewModel().render(SELECTOR);
        expect(document.getElementById(SELECTOR)).not.toBeNull();
    });

    it('destroy() empties the container and marks the view as destroyed', () => {
        const vm = new GreetingViewModel();
        vm.render(SELECTOR);
        vm.destroy();

        expect(document.getElementById(SELECTOR)!.innerHTML).toBe('');
    });

    it('re-rendering a destroyed view model works without throwing', () => {
        const vm = new GreetingViewModel();
        vm.render(SELECTOR);
        vm.destroy();

        expect(() => vm.render(SELECTOR)).not.toThrow();
        expect(document.getElementById(SELECTOR)!.textContent).toBe('Hello');
    });

    it('renderHtml renders without touching the shared DOM container', () => {
        const vm = new GreetingViewModel();
        const html = vm.renderHtml();

        expect(html).toContain('Hello');
        expect(document.getElementById(SELECTOR)).toBeNull();
    });

    it('registerSubscription disposes the subscription once destroy() is called', () => {
        const vm = new SubscribingViewModel();
        vm.render(SELECTOR);

        vm.counter(1);
        expect(vm.fireCount).toBe(1);

        vm.destroy();
        vm.counter(2);
        vm.counter(3);
        expect(vm.fireCount).toBe(1); // no longer firing after destroy
    });

    it('destroy() is a safe no-op when called twice', () => {
        const vm = new SubscribingViewModel();
        vm.render(SELECTOR);
        vm.destroy();
        expect(() => vm.destroy()).not.toThrow();
    });
});
