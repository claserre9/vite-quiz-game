import { BaseViewModel } from '@core/BaseViewModel';

export class DashboardSettingsViewModel extends BaseViewModel {
    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`<h2>Dashboard Settings</h2>`);
    }
}
