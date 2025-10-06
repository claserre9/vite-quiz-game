import { BaseViewModel } from '@core/BaseViewModel';

export class AccessDeniedViewModel extends BaseViewModel {
    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`<h1>Access Denied</h1>`);
    }
}
