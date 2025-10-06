import { BaseViewModel } from '@core/BaseViewModel';
import page from 'page';
import { setAuth } from '@store/AppStore';

export class LoginViewModel extends BaseViewModel {
    public performLogin = (): void => {
        setAuth('demo', 'admin');
        page.redirect('/dashboard');
    };

    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`
            <div class="login">
                <h1>Login</h1>
                <button data-bind="click: performLogin">Login</button>
            </div>
        `);
    }
}
