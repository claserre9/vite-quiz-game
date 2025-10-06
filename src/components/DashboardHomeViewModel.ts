import { BaseViewModel } from '@core/BaseViewModel';

export class DashboardHomeViewModel extends BaseViewModel {
    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`<h2>Dashboard Home</h2>`);
    }
}
