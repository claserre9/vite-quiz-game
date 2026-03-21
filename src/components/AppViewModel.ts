import { BaseViewModel } from '@core/BaseViewModel';

export class AppViewModel extends BaseViewModel {
    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`
            <div class="qm-shell">
                <a href="/about" style="display:none"></a>
                <nav class="navbar navbar-expand-lg qm-navbar">
                    <div class="container">
                        <a class="navbar-brand qm-brand" href="/">
                            <span class="qm-brand-badge">🧠</span>
                            <span>Quiz Math</span>
                        </a>
                        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        <div class="collapse navbar-collapse" id="navbarNav">
                            <ul class="navbar-nav ms-auto">
                                <li class="nav-item"><a class="nav-link qm-nav-link" href="/a-propos">À propos</a></li>
                            </ul>
                        </div>
                    </div>
                </nav>

                <main class="container qm-hero">
                    <section class="qm-hero-card text-center">
                        <span class="qm-pill">✨ Révise en jouant</span>
                        <h1 class="qm-hero-title">Les maths deviennent <span class="qm-highlight">fun</span> et rythmées.</h1>
                        <p class="qm-lead">
                            Choisis ton défi, lance une série de questions et bats ton meilleur score
                            sur addition, soustraction ou multiplication.
                        </p>
                        <div class="qm-hero-stats">
                            <span class="qm-stat-chip">20 questions par partie</span>
                            <span class="qm-stat-chip">15 secondes par question</span>
                            <span class="qm-stat-chip">Mode entraînement inclus</span>
                        </div>
                        <div class="qm-home-actions">
                            <a href="/entrainement" class="btn qm-btn px-4 py-3">🎯 Mode Entraînement</a>
                            <a href="/quiz/addition" class="btn qm-btn-secondary px-4 py-3">🚀 Lancer une partie</a>
                        </div>
                    </section>

                    <section class="my-5 text-center">
                        <h2 class="qm-section-title">Choisis ton terrain de jeu</h2>
                        <p class="qm-section-copy">
                            Trois univers, trois façons de progresser, une seule mission : apprendre plus vite sans t’ennuyer.
                        </p>
                    </section>

                    <section class="row g-4 pb-5">
                        <div class="col-12 col-md-4">
                            <div class="card qm-feature-card" data-tone="addition">
                                <div class="card-body d-flex flex-column">
                                    <div class="qm-feature-icon">➕</div>
                                    <span class="qm-badge-soft mb-3">Rapidité mentale</span>
                                    <h3 class="card-title h4">Addition</h3>
                                    <p class="card-text qm-muted">Enchaîne les calculs et développe des réflexes de champion.</p>
                                    <a href="/quiz/addition" class="btn qm-btn mt-auto px-4 py-3">Commencer</a>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-md-4">
                            <div class="card qm-feature-card" data-tone="soustraction">
                                <div class="card-body d-flex flex-column">
                                    <div class="qm-feature-icon">➖</div>
                                    <span class="qm-badge-soft mb-3">Précision et logique</span>
                                    <h3 class="card-title h4">Soustraction</h3>
                                    <p class="card-text qm-muted">Travaille ta précision avec des questions variées et progressives.</p>
                                    <a href="/quiz/soustraction" class="btn qm-btn mt-auto px-4 py-3">Commencer</a>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-md-4">
                            <div class="card qm-feature-card" data-tone="multiplication">
                                <div class="card-body d-flex flex-column">
                                    <div class="qm-feature-icon">✖️</div>
                                    <span class="qm-badge-soft mb-3">Tables en turbo</span>
                                    <h3 class="card-title h4">Multiplication</h3>
                                    <p class="card-text qm-muted">Renforce les tables et gagne en vitesse avec un format nerveux.</p>
                                    <a href="/quiz/multiplication" class="btn qm-btn mt-auto px-4 py-3">Commencer</a>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        `);
    }
}
