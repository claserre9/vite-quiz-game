import { BaseViewModel } from '@core/BaseViewModel';
import { observable } from 'knockout';

export class TrainingViewModel extends BaseViewModel {
  op = observable<'addition' | 'multiplication' | 'soustraction'>('addition');
  table = observable<number>(2);

  constructor(context: PageJS.Context | undefined) {
    super(context);
    this.setTemplate(this.getTemplate());
  }

  private getTemplate() {
    return `
      <div class="container my-5" style="max-width: 640px;">
        <a href="/" class="btn btn-sm btn-primary mb-3">🏠 Accueil</a>
        <div class="card">
          <div class="card-body">
            <h1 class="h4 mb-3">Mode Entraînement</h1>
            <div class="row g-3 align-items-end">
              <div class="col-12 col-md-6">
                <label class="form-label">Type d'opération</label>
                <select class="form-select" data-bind="value: op">
                  <option value="addition">Addition</option>
                  <option value="soustraction">Soustraction</option>
                  <option value="multiplication">Multiplication</option>
                </select>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label">Table</label>
                <select class="form-select" data-bind="value: table">
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

            <div class="mt-4 d-flex gap-2">
              <button class="btn btn-success" data-bind="click: startTraining">🚀 Commencer</button>
              <a href="/" class="btn btn-outline-secondary">Annuler</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  startTraining = () => {
    const op = this.op();
    const table = this.table();
    const qs = new URLSearchParams({ mode: 'training', table: String(table) });
    const path = `/quiz/${op}?${qs.toString()}`;
    if ((window as any).page && typeof (window as any).page.show === 'function') {
      (window as any).page.show(path);
    } else {
      window.location.href = path;
    }
  };
}
