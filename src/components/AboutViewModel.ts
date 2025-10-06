import { BaseViewModel } from '@core/BaseViewModel';

export class AboutViewModel extends BaseViewModel {
    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`
            <div class="app-container">
                <h1>About</h1>
            </div>
        `);
    }
}
