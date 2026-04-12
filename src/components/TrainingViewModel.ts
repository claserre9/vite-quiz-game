import { BaseViewModel } from '@core/BaseViewModel';
import { url } from '@core/url';
import { observable } from 'knockout';

export class TrainingViewModel extends BaseViewModel {
  op = observable<'addition' | 'multiplication' | 'soustraction'>('addition');
  exercise = observable<'classic' | 'missing-number' | 'true-false' | 'comparison' | 'sequence'>('classic');
  table = observable<number>(2);

  constructor(context: PageJS.Context | undefined) {
    super(context);
    this.setTemplate(this.getTemplate());
  }

  private getTemplate() {
    return `
      <div class="container qm-training-page" style="max-width: 760px;">
        <a href="${url('/')}" class="btn qm-btn-home mb-3">🏠 Accueil</a>
        <div class="qm-panel">
          <div class="text-center mb-4">
            <span class="qm-pill">🎯 Mode Entraînement</span>
            <h1 class="qm-section-title mt-3 mb-2">Prépare ton défi sur mesure</h1>
            <p class="qm-muted mb-0">Choisis une opération, une table et lance une session sans pression.</p>
          </div>

          <div class="row g-3 align-items-end">
              <div class="col-12 col-md-6">
                <label class="form-label fw-bold">Type d'opération</label>
                <select class="form-select qm-select" data-bind="value: op">
                  <option value="addition">Addition</option>
                  <option value="soustraction">Soustraction</option>
                  <option value="multiplication">Multiplication</option>
                </select>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label fw-bold">Type d'exercice</label>
                <select class="form-select qm-select" data-bind="value: exercise">
                  <optgroup label="Choix multiple">
                    <option value="classic">Quiz classique</option>
                    <option value="missing-number">Nombre manquant</option>
                    <option value="true-false">Vrai ou faux</option>
                    <option value="comparison">Comparaison rapide</option>
                    <option value="sequence">Suites logiques</option>
                    <option value="inverse">Opération inverse</option>
                    <option value="duel">Duel de calculs</option>
                  </optgroup>
                  <optgroup label="Saisie libre">
                    <option value="free-input">Saisie libre</option>
                    <option value="sprint">Sprint chronométré ⏱️</option>
                    <option value="table-gaps">Table à compléter</option>
                  </optgroup>
                </select>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label fw-bold">Table</label>
                <select class="form-select qm-select" data-bind="value: table">
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                </select>
              </div>
          </div>

          <div class="mt-4 d-flex flex-wrap gap-2 justify-content-center">
            <button class="btn qm-btn px-4 py-3" data-bind="click: startTraining">🚀 Commencer</button>
            <a href="${url('/')}" class="btn qm-btn-secondary px-4 py-3">Annuler</a>
          </div>
        </div>
      </div>
    `;
  }

  startTraining = () => {
    const exercise = this.exercise();
    const op = exercise === 'comparison' || exercise === 'sequence' ? 'general' : this.op();
    const table = this.table();
    const qs = new URLSearchParams({
      mode: 'training',
      table: String(table),
      exercise,
    });
    const path = `/quiz/${op}?${qs.toString()}`;
    if (window.page && typeof window.page.show === 'function') {
      window.page.show(path);
    } else {
      window.location.href = path;
    }
  };
}
