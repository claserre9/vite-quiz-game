import { BaseViewModel } from '@core/BaseViewModel';

export class AppViewModel extends BaseViewModel {
    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`
            <div class="app-container">
                <h1>App</h1>
                <nav>
                    <ul>
                        <li><a href="/about">About</a></li>
                    </ul>
                </nav>
            </div>
        `);
    }
}
