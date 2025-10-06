import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AppViewModel } from '../src/components/AppViewModel';
import { renderViewModel, cleanup } from './knockout-test-utils';

describe('AppViewModel', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    afterEach(() => {
        cleanup();
    });

    it('renders navigation link to about page', () => {
        const { container } = renderViewModel(AppViewModel);
        const link = container.querySelector('a');
        expect(link?.getAttribute('href')).toBe('/about');
    });
});
