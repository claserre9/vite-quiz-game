import { BaseViewModel } from '@core/BaseViewModel';

export class AboutViewModel extends BaseViewModel {
    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(`
            <div class="container my-5" style="max-width: 800px;">
                <a href="/" class="btn btn-sm btn-primary mb-3">🏠 Accueil</a>
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h1 class="h4 mb-3">À propos de Quiz Math</h1>
                        <p>
                            Quiz Math est une petite application pour s'entraîner aux opérations de base
                            (addition, soustraction, multiplication) au travers de quiz rapides ou en mode
                            entraînement sans contrainte de temps.
                        </p>
                        <p>
                            Tu peux choisir l'opération, la difficulté et suivre ta progression question après question.
                            L'objectif est d'apprendre en s'amusant, sur ordinateur comme sur mobile.
                        </p>
                        <hr />
                        <p class="mb-0">
                            Une remarque ou une idée d'amélioration ? Écris-moi à
                            <a href="mailto:claserre9@gmail.com">claserre9@gmail.com</a>.
                        </p>
                    </div>
                </div>
            </div>
        `);
    }
}
