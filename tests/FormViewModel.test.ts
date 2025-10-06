import { describe, it, expect, vi } from 'vitest';
import { FormViewModel } from '../src/core/FormViewModel';

class TestForm extends FormViewModel {
    public name = this.registerField('name', '', [
        {
            validator: (v) => typeof v === 'string' && v.length > 0,
            message: 'required',
        },
    ]);
    public age = this.registerField('age', 0, [
        {
            validator: (v) => typeof v === 'number' && v > 0,
            message: 'invalid age',
        },
    ]);
    constructor() {
        super(undefined);
        this.setSteps([['name'], ['age']]);
    }
}

describe('FormViewModel', () => {
    it('validates fields', () => {
        const form = new TestForm();
        expect(form.validate()).toBe(false);
        expect(form.errors.name()).toBe('required');
        form.name('John');
        form.age(10);
        expect(form.validate()).toBe(true);
    });

    it('supports step navigation', () => {
        const form = new TestForm();
        form.nextStep();
        expect(form.currentStep()).toBe(0);
        form.name('Jane');
        form.nextStep();
        expect(form.currentStep()).toBe(1);
        form.prevStep();
        expect(form.currentStep()).toBe(0);
    });

    it('submits and returns values without steps', () => {
        class SimpleForm extends FormViewModel {
            public name = this.registerField('name', '', [
                {
                    validator: (v) => typeof v === 'string' && v.length > 0,
                    message: 'required',
                },
            ]);
            public email = this.registerField('email', '', [
                {
                    validator: (v) => typeof v === 'string' && v.includes('@'),
                    message: 'invalid',
                },
            ]);
        }
        const form = new SimpleForm();
        const handler = vi.fn();
        form.name('Alice');
        form.email('alice@example.com');
        form.submit(() => handler(form.getValues()));
        expect(handler).toHaveBeenCalledWith({
            name: 'Alice',
            email: 'alice@example.com',
        });
    });
});
