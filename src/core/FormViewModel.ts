import { observable } from 'knockout';
import { BaseViewModel } from './BaseViewModel';

export interface ValidationRule {
    validator: (value: unknown) => boolean;
    message: string;
}

export type StepConfig = string[];

export class FormViewModel extends BaseViewModel {
    public fields: Record<string, KnockoutObservable<unknown>> = {};
    public errors: Record<string, KnockoutObservable<string | null>> = {};
    private rules: Record<string, ValidationRule[]> = {};
    private steps: StepConfig[] = [];
    public currentStep = observable(0);

    protected registerField(
        name: string,
        initialValue: unknown = '',
        rules: ValidationRule[] = []
    ): KnockoutObservable<unknown> {
        this.fields[name] = observable(initialValue);
        this.errors[name] = observable<string | null>(null);
        this.rules[name] = rules;
        return this.fields[name];
    }

    public setSteps(steps: StepConfig[]): void {
        this.steps = steps;
    }

    public validateField(name: string): boolean {
        const rules = this.rules[name];
        const field = this.fields[name];
        if (!rules || !field) return true;
        for (const rule of rules) {
            if (!rule.validator(field())) {
                this.errors[name]?.(rule.message);
                return false;
            }
        }
        this.errors[name]?.(null);
        return true;
    }

    public validateStep(stepIndex = this.currentStep()): boolean {
        const step = this.steps[stepIndex];
        if (!step) return true;
        return step.every((name) => this.validateField(name));
    }

    public validate(): boolean {
        return Object.keys(this.fields).every((name) =>
            this.validateField(name)
        );
    }

    public getValues(): Record<string, unknown> {
        const values: Record<string, unknown> = {};
        Object.keys(this.fields).forEach((name) => {
            values[name] = this.fields[name]();
        });
        return values;
    }

    public nextStep(): void {
        if (this.currentStep() >= this.steps.length - 1) return;
        if (this.validateStep(this.currentStep())) {
            this.currentStep(this.currentStep() + 1);
        }
    }

    public prevStep(): void {
        if (this.currentStep() > 0) {
            this.currentStep(this.currentStep() - 1);
        }
    }

    public submit(handler: () => void): void {
        if (this.validate()) {
            handler();
        }
    }
}
