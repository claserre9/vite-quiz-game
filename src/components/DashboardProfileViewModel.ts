import { BaseViewModel } from '@core/BaseViewModel';

export class DashboardProfileViewModel extends BaseViewModel {
    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`<h2>Dashboard Profile</h2>`);
    }
}
