import { BaseViewModel } from '@core/BaseViewModel';
import { url } from '@core/url';
import { ProfileStore } from '@store/ProfileStore';

export class AppViewModel extends BaseViewModel {
    constructor(context: PageJS.Context | undefined) {
        super(context);
        const profile = ProfileStore.getActiveProfile();
        const profileBar = profile
            ? `
            <div class="qm-profile-bar">
                <div class="qm-profile-chip">
                    <span class="qm-profile-chip-avatar"
                          style="background: ${ProfileStore.getColorGradient(profile.color)}">${profile.avatar}</span>
                    <span class="qm-profile-chip-name">${profile.name}</span>
                </div>
                <a href="${url('/profils')}" class="qm-profile-change-btn">Changer de profil</a>
            </div>`
            : '';
        this.setTemplate(`
            <div class="qm-shell">
                <a href="${url('/about')}" style="display:none"></a>
                <nav class="navbar navbar-expand-lg qm-navbar">
                    <div class="container">
                        <a class="navbar-brand qm-brand" href="${url('/')}">
                            <span class="qm-brand-badge">🧠</span>
                            <span>Quiz Math</span>
                        </a>
                        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        <div class="collapse navbar-collapse" id="navbarNav">
                            <ul class="navbar-nav ms-auto">
                                <li class="nav-item"><a class="nav-link qm-nav-link" href="${url('/a-propos')}">À propos</a></li>
                            </ul>
                        </div>
                    </div>
                </nav>

                ${profileBar}
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
                            <a href="${url('/tables')}" class="btn qm-btn px-4 py-3">📚 Tables 1 à 10</a>
                            <a href="${url('/entrainement')}" class="btn qm-btn-secondary px-4 py-3">🎯 Mode Entraînement</a>
                            <a href="${url('/quiz/addition')}" class="btn qm-btn-secondary px-4 py-3">🚀 Lancer une partie</a>
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
                            <div class="card qm-feature-card" data-tone="tables">
                                <div class="card-body d-flex flex-column">
                                    <div class="qm-feature-icon">📚</div>
                                    <span class="qm-badge-soft mb-3">Tables 1 à 10</span>
                                    <h3 class="card-title h4">Tables à apprendre</h3>
                                    <p class="card-text qm-muted">Entraîne-toi sur chaque table d'addition ou de multiplication, de 1 à 10.</p>
                                    <a href="${url('/tables')}" class="btn qm-btn mt-auto px-4 py-3">S'entraîner</a>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-md-4">
                            <div class="card qm-feature-card" data-tone="addition">
                                <div class="card-body d-flex flex-column">
                                    <div class="qm-feature-icon">➕</div>
                                    <span class="qm-badge-soft mb-3">Rapidité mentale</span>
                                    <h3 class="card-title h4">Addition</h3>
                                    <p class="card-text qm-muted">Enchaîne les calculs et développe des réflexes de champion.</p>
                                    <a href="${url('/quiz/addition')}" class="btn qm-btn mt-auto px-4 py-3">Commencer</a>
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
                                    <a href="${url('/quiz/soustraction')}" class="btn qm-btn mt-auto px-4 py-3">Commencer</a>
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
                                    <a href="${url('/quiz/multiplication')}" class="btn qm-btn mt-auto px-4 py-3">Commencer</a>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="my-2 text-center">
                        <h2 class="qm-section-title">Nouveaux défis</h2>
                        <p class="qm-section-copy">
                            Varie les mécaniques pour travailler la logique, la rapidité et l’observation.
                        </p>
                    </section>

                    <section class="row g-4 pb-5">
                        <div class="col-12 col-md-6 col-xl-4">
                            <div class="card qm-feature-card" data-tone="addition">
                                <div class="card-body d-flex flex-column">
                                    <div class="qm-feature-icon">🕳️</div>
                                    <span class="qm-badge-soft mb-3">Priorité 1</span>
                                    <h3 class="card-title h4">Nombre manquant</h3>
                                    <p class="card-text qm-muted">Trouve la valeur cachée dans une addition, soustraction ou multiplication.</p>
                                    <a href="${url('/quiz/addition?exercise=missing-number')}" class="btn qm-btn mt-auto px-4 py-3">Tester</a>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-md-6 col-xl-4">
                            <div class="card qm-feature-card" data-tone="soustraction">
                                <div class="card-body d-flex flex-column">
                                    <div class="qm-feature-icon">✅</div>
                                    <span class="qm-badge-soft mb-3">Priorité 2</span>
                                    <h3 class="card-title h4">Vrai ou faux</h3>
                                    <p class="card-text qm-muted">Décide en un éclair si une égalité mathématique est correcte.</p>
                                    <a href="${url('/quiz/multiplication?exercise=true-false')}" class="btn qm-btn mt-auto px-4 py-3">Tester</a>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-md-6 col-xl-4">
                            <div class="card qm-feature-card" data-tone="multiplication">
                                <div class="card-body d-flex flex-column">
                                    <div class="qm-feature-icon">⚖️</div>
                                    <span class="qm-badge-soft mb-3">Priorité 3</span>
                                    <h3 class="card-title h4">Comparaison rapide</h3>
                                    <p class="card-text qm-muted">Repère instantanément le plus grand nombre, ou l’égalité.</p>
                                    <a href="${url('/quiz/general?exercise=comparison')}" class="btn qm-btn mt-auto px-4 py-3">Tester</a>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-md-6 col-xl-4">
                            <div class="card qm-feature-card" data-tone="addition">
                                <div class="card-body d-flex flex-column">
                                    <div class="qm-feature-icon">⏱️</div>
                                    <span class="qm-badge-soft mb-3">Priorité 4</span>
                                    <h3 class="card-title h4">Défi chrono</h3>
                                    <p class="card-text qm-muted">Enchaîne le plus de bonnes réponses possible en 60 secondes.</p>
                                    <a href="${url('/quiz/general?exercise=chrono')}" class="btn qm-btn mt-auto px-4 py-3">Tester</a>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-md-6 col-xl-4">
                            <div class="card qm-feature-card" data-tone="soustraction">
                                <div class="card-body d-flex flex-column">
                                    <div class="qm-feature-icon">🔢</div>
                                    <span class="qm-badge-soft mb-3">Priorité 5</span>
                                    <h3 class="card-title h4">Suites logiques</h3>
                                    <p class="card-text qm-muted">Complète des suites numériques et affine ton raisonnement.</p>
                                    <a href="${url('/quiz/general?exercise=sequence')}" class="btn qm-btn mt-auto px-4 py-3">Tester</a>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer class="qm-footer">
                    v${__APP_VERSION__} · ${__BUILD_COMMIT__} · ${__BUILD_DATE__}
                </footer>
            </div>
        `);
    }
}
