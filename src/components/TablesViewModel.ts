import { BaseViewModel } from '@core/BaseViewModel';
import { url } from '@core/url';
import { observable } from 'knockout';

type TableOp = 'addition' | 'multiplication';

export class TablesViewModel extends BaseViewModel {
    op = observable<TableOp>('addition');

    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(this.getTemplate());
    }

    private getBestScore(op: TableOp, table: number): string {
        if (typeof window === 'undefined' || !window.localStorage) return '';
        const key = `quiz-math-best:classic:${op}:training:t${table}`;
        const raw = window.localStorage.getItem(key);
        if (!raw) return '';
        // New format: "score/total" — legacy format: plain number (assume /20)
        const label = raw.includes('/') ? raw : `${raw}/20`;
        return `Record : ${label}`;
    }

    private buildTableCards(op: TableOp): string {
        let cards = '';
        for (let t = 1; t <= 10; t++) {
            const symbol = op === 'addition' ? '+' : '×';
            const qs = new URLSearchParams({ mode: 'training', table: String(t), exercise: 'classic', maxFactor: '10' });
            const href = url(`/quiz/${op}?${qs.toString()}`);
            const best = this.getBestScore(op, t);
            const bestHtml = best
                ? `<span class="qm-badge-soft mt-2">${best}</span>`
                : `<span class="qm-badge-soft mt-2" style="opacity:0.4">Pas encore joué</span>`;

            cards += `
            <div class="col-6 col-sm-4 col-md-3 col-lg-2">
                <a href="${href}" class="card qm-feature-card qm-table-card text-decoration-none" data-tone="${op}">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center p-3">
                        <div class="qm-table-number">${t}</div>
                        <div class="qm-muted small mt-1">Table de ${t} ${symbol}</div>
                        ${bestHtml}
                    </div>
                </a>
            </div>`;
        }
        return cards;
    }

    private getTemplate(): string {
        const additionCards = this.buildTableCards('addition');
        const multiCards = this.buildTableCards('multiplication');

        return `
        <div class="container qm-tables-page" style="max-width: 900px;">
            <a href="${url('/')}" class="btn qm-btn-home mb-3">🏠 Accueil</a>

            <div class="qm-panel">
                <div class="text-center mb-4">
                    <span class="qm-pill">📚 Tables à apprendre</span>
                    <h1 class="qm-section-title mt-3 mb-2">Tables de 1 à 10</h1>
                    <p class="qm-muted mb-0">Choisis une table et entraîne-toi sans limite de temps !</p>
                </div>

                <div class="d-flex justify-content-center gap-3 mb-4">
                    <button class="btn qm-btn px-4 py-2" id="tab-addition" onclick="
                        document.getElementById('section-addition').style.display='';
                        document.getElementById('section-multiplication').style.display='none';
                        document.getElementById('tab-addition').classList.add('active-tab');
                        document.getElementById('tab-multi').classList.remove('active-tab');
                    ">➕ Addition</button>
                    <button class="btn qm-btn-secondary px-4 py-2" id="tab-multi" onclick="
                        document.getElementById('section-multiplication').style.display='';
                        document.getElementById('section-addition').style.display='none';
                        document.getElementById('tab-multi').classList.add('active-tab');
                        document.getElementById('tab-addition').classList.remove('active-tab');
                    ">✖️ Multiplication</button>
                </div>

                <div id="section-addition">
                    <h2 class="qm-section-title text-center mb-3" style="font-size:1.1rem;">Tables d'addition</h2>
                    <div class="row g-3 justify-content-center">
                        ${additionCards}
                    </div>
                </div>

                <div id="section-multiplication" style="display:none;">
                    <h2 class="qm-section-title text-center mb-3" style="font-size:1.1rem;">Tables de multiplication</h2>
                    <div class="row g-3 justify-content-center">
                        ${multiCards}
                    </div>
                </div>
            </div>
        </div>`;
    }
}
