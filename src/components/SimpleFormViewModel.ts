import { FormViewModel, type ValidationRule } from '@core/FormViewModel';

const required = (message: string): ValidationRule => ({
    validator: (v: unknown) => typeof v === 'string' && v.trim().length > 0,
    message,
});

const emailRule: ValidationRule = {
    validator: (v: unknown) =>
        typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    message: 'Invalid email address',
};

export class SimpleFormViewModel extends FormViewModel {
    public name = this.registerField('name', '', [
        required('Name is required'),
    ]);
    public email = this.registerField('email', '', [
        required('Email is required'),
        emailRule,
    ]);

    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`
            <div class="simple-form">
                <form data-bind="submit: onSubmit">
                    <div>
                        <label for="name">Name</label>
                        <input id="name" data-bind="value: name" />
                        <span data-bind="text: errors.name"></span>
                    </div>
                    <div>
                        <label for="email">Email</label>
                        <input id="email" data-bind="value: email" />
                        <span data-bind="text: errors.email"></span>
                    </div>
                    <button type="submit">Submit</button>
                </form>
            </div>
        `);
    }

    public onSubmit = (): void => {
        this.submit(() => {
            console.log(this.getValues());
        });
    };
}
