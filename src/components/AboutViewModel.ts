import { BaseViewModel } from '@core/BaseViewModel';
import { url } from '@core/url';

export class AboutViewModel extends BaseViewModel {
    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`
            <div class="container qm-about-page" style="max-width: 860px;">
                <a href="${url('/')}" class="btn qm-btn-home mb-3">🏠 Accueil</a>
                <div class="qm-about-card">
                    <span class="qm-pill">📘 À propos</span>
                    <h1 class="qm-section-title mt-3">Quiz Math, pensé pour apprendre avec le sourire</h1>
                    <p class="qm-muted">
                        Quiz Math est une application légère pour s’entraîner aux opérations de base
                        avec des parties courtes, lisibles et motivantes.
                    </p>
                    <div class="row g-4 mt-1">
                        <div class="col-12 col-md-4">
                            <div class="qm-score-item h-100">
                                <span class="qm-score-label">Objectif</span>
                                <span class="qm-score-value">S’amuser</span>
                                <p class="qm-muted mb-0 mt-2">Faire travailler les automatismes sans ambiance scolaire lourde.</p>
                            </div>
                        </div>
                        <div class="col-12 col-md-4">
                            <div class="qm-score-item h-100">
                                <span class="qm-score-label">Format</span>
                                <span class="qm-score-value">Rapide</span>
                                <p class="qm-muted mb-0 mt-2">Des sessions courtes à lancer facilement sur ordinateur comme sur mobile.</p>
                            </div>
                        </div>
                        <div class="col-12 col-md-4">
                            <div class="qm-score-item h-100">
                                <span class="qm-score-label">Progression</span>
                                <span class="qm-score-value">Visible</span>
                                <p class="qm-muted mb-0 mt-2">Le score, la cadence et le mode entraînement rendent l’évolution concrète.</p>
                            </div>
                        </div>
                    </div>
                    <hr />
                    <p class="mb-0">
                        Une remarque ou une idée d’amélioration ? Écris-moi à
                        <a href="mailto:claserre9@gmail.com">claserre9@gmail.com</a>.
                    </p>
                </div>
            </div>
        `);
    }
}
