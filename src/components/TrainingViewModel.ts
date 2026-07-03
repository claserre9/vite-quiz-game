import { BaseViewModel } from '@core/BaseViewModel';
import { observable, observableArray } from 'knockout';
import type { ExerciseType, Operation } from '@core/QuestionGenerator';

type Difficulty = 'facile' | 'moyen' | 'difficile';

const DIFFICULTY_MAX: Record<Difficulty, number> = {
    facile: 6,
    moyen: 11,
    difficile: 20,
};

export class TrainingViewModel extends BaseViewModel {
    op = observable<Exclude<Operation, 'general'> | 'general'>('addition');
    exercise = observable<ExerciseType>('classic');
    tables = observableArray<number>([2]);
    difficulty = observable<Difficulty>('moyen');

    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(this.getTemplate());
    }

    private getTemplate() {
        return `
      <div class="container qm-training-page" style="max-width: 760px;">
        <a href="/" class="btn qm-btn-home mb-3">🏠 Accueil</a>
        <div class="qm-panel">
          <div class="text-center mb-4">
            <span class="qm-pill">🎯 Mode Entraînement</span>
            <h1 class="qm-section-title mt-3 mb-2">Prépare ton défi sur mesure</h1>
            <p class="qm-muted mb-0">Choisis une opération, tes tables et lance une session sans pression.</p>
          </div>

          <div class="row g-3 align-items-end">
              <div class="col-12 col-md-6">
                <label class="form-label fw-bold">Type d'opération</label>
                <select class="form-select qm-select" data-bind="value: op">
                  <option value="addition">➕ Addition</option>
                  <option value="soustraction">➖ Soustraction</option>
                  <option value="multiplication">✖️ Multiplication</option>
                  <option value="division">➗ Division</option>
                  <option value="general">🎲 Mode aléatoire</option>
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
                <label class="form-label fw-bold">Difficulté</label>
                <select class="form-select qm-select" data-bind="value: difficulty">
                  <option value="facile">🟢 Facile — chiffres 1 à 6</option>
                  <option value="moyen">🟡 Moyen — chiffres 1 à 11</option>
                  <option value="difficile">🔴 Difficile — chiffres 1 à 20</option>
                </select>
              </div>
          </div>

          <div class="mt-3">
            <label class="form-label fw-bold">
              Tables
              <span class="qm-muted ms-1" style="font-weight:400; font-size:0.82rem;" data-bind="visible: tables().length === 0">— choisir au moins une</span>
              <span class="qm-muted ms-1" style="font-weight:400; font-size:0.82rem;" data-bind="visible: tables().length > 0">
                — <span data-bind="text: tables().length"></span> sélectionnée<span data-bind="visible: tables().length > 1">s</span>
              </span>
            </label>
            <div class="d-flex flex-wrap gap-2" data-bind="foreach: [1,2,3,4,5,6,7,8,9,10,11]">
              <label class="qm-table-tag" data-bind="css: { 'qm-table-tag--active': $root.tables().indexOf($data) >= 0 }">
                <input type="checkbox" style="display:none" data-bind="checked: $root.tables, checkedValue: $data">
                <span data-bind="text: $data"></span>
              </label>
            </div>
          </div>

          <div class="mt-4 d-flex flex-wrap gap-2 justify-content-center">
            <button class="btn qm-btn px-4 py-3" data-bind="click: startTraining, disable: tables().length === 0">🚀 Commencer</button>
            <a href="/" class="btn qm-btn-secondary px-4 py-3">Annuler</a>
          </div>
        </div>
      </div>
    `;
    }

    startTraining = () => {
        const exercise = this.exercise();
        const tables = this.tables();
        if (tables.length === 0) return;
        const needsGeneral =
            exercise === 'comparison' || exercise === 'sequence';
        const op = needsGeneral ? 'general' : this.op();
        const maxFactor = DIFFICULTY_MAX[this.difficulty()];
        const qs = new URLSearchParams({
            mode: 'training',
            tables: tables.join(','),
            exercise,
            maxFactor: String(maxFactor),
            difficulty: this.difficulty(),
        });
        const path = `/quiz/${op}?${qs.toString()}`;
        if (window.page && typeof window.page.show === 'function') {
            window.page.show(path);
        } else {
            window.location.href = path;
        }
    };
}
