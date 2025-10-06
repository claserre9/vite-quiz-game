import { BaseViewModel, renderView } from '@core/BaseViewModel';

export class DashboardViewModel extends BaseViewModel {
    private contentContainer = 'dashboard-content';

    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`
            <div class="dashboard-layout">
                <nav>
                    <ul>
                        <li><a href="/dashboard">Home</a></li>
                        <li><a href="/dashboard/profile">Profile</a></li>
                        <li><a href="/dashboard/settings">Settings</a></li>
                    </ul>
                </nav>
                <div id="${this.contentContainer}"></div>
            </div>
        `);
    }

    public renderContent(
        ViewModel: new (context?: PageJS.Context) => BaseViewModel,
        context?: PageJS.Context
    ): BaseViewModel {
        return renderView(ViewModel, context, this.contentContainer);
    }
}
