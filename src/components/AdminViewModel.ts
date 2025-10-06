import { BaseViewModel } from '@core/BaseViewModel';

export class AdminViewModel extends BaseViewModel {
    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`<h1>Admin Area</h1>`);
    }
}
