import { observable } from 'knockout';
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

export class ContactFormViewModel extends FormViewModel {
    public name = this.registerField('name', '', [
        required('Name is required'),
    ]);
    public email = this.registerField('email', '', [
        required('Email is required'),
        emailRule,
    ]);
    public message = this.registerField('message', '', [
        required('Message is required'),
    ]);
    public isSubmitted = observable(false);

    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setSteps([['name', 'email'], ['message']]);
        this.setTemplate(`
            <div class="contact-form">
                <form data-bind="submit: onSubmit">
                    <!-- Step 1 -->
                    <div data-bind="visible: currentStep() === 0">
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
                        <button type="button" data-bind="click: nextStep">Next</button>
                    </div>
                    <!-- Step 2 -->
                    <div data-bind="visible: currentStep() === 1">
                        <div>
                            <label for="message">Message</label>
                            <textarea id="message" data-bind="value: message"></textarea>
                            <span data-bind="text: errors.message"></span>
                        </div>
                        <button type="button" data-bind="click: prevStep">Back</button>
                        <button type="submit">Submit</button>
                    </div>
                </form>
                <div data-bind="visible: isSubmitted">
                    <p>Thank you for your message!</p>
                </div>
            </div>
        `);
    }

    public onSubmit = (): void => {
        this.submit(() => {
            this.isSubmitted(true);
        });
    };
}
