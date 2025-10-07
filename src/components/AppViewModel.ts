import { BaseViewModel } from '@core/BaseViewModel';

export class AppViewModel extends BaseViewModel {
    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`
                    <a href="/about" style="display:none"></a>
            <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
                <div class="container">
                    <a class="navbar-brand" href="/">🧮 Quiz Math</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto">
                            <li class="nav-item"><a class="nav-link" href="/about">À propos</a></li>
                        </ul>
                    </div>
                </div>
            </nav>

            <main class="container my-5">
                <div class="text-center mb-4">
                    <h1 class="display-5">Choisis ton quiz</h1>
                    <p class="lead">Entraîne-toi avec des additions, soustractions ou multiplications. Tout est responsive !</p>
                    <div class="mt-3">
                        <a href="/entrainement" class="btn btn-outline-primary">🎯 Mode Entraînement</a>
                    </div>
                </div>

                <div class="row g-4">
                    <div class="col-12 col-md-4">
                        <div class="card h-100 shadow-sm">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">➕ Addition</h5>
                                <p class="card-text">Teste ta rapidité avec des additions variées.</p>
                                <a href="/quiz/addition" class="btn btn-primary mt-auto">Commencer</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-md-4">
                        <div class="card h-100 shadow-sm">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">➖ Soustraction</h5>
                                <p class="card-text">Mesure-toi à des soustractions de difficulté croissante.</p>
                                <a href="/quiz/soustraction" class="btn btn-warning mt-auto">Commencer</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-md-4">
                        <div class="card h-100 shadow-sm">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">✖️ Multiplication</h5>
                                <p class="card-text">Deviens imbattable sur les tables de multiplication.</p>
                                <a href="/quiz/multiplication" class="btn btn-success mt-auto">Commencer</a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        `);
    }
}
