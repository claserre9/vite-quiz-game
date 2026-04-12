import { BaseViewModel } from '@core/BaseViewModel';
import { url } from '@core/url';

export class NotFoundViewModel extends BaseViewModel {
    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`
            <div class="container qm-notfound-page" style="max-width: 760px;">
                <div class="qm-empty-card text-center">
                    <div class="display-2 mb-3">🧭</div>
                    <span class="qm-pill">404</span>
                    <h1 class="qm-section-title mt-3">Cette page s'est perdue en route</h1>
                    <p class="qm-muted">
                        Le lien demandé n'existe pas ou n'est plus disponible.
                    </p>
                    <a href="${url('/')}" class="btn qm-btn px-4 py-3 mt-2">🏠 Revenir à l'accueil</a>
                </div>
            </div>
        `);
    }
}
