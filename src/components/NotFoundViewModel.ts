import { BaseViewModel } from '@core/BaseViewModel';

export class NotFoundViewModel extends BaseViewModel {
    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`<h1>Not found</h1>`);
    }
}
