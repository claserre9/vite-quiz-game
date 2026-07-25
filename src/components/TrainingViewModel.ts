import { BaseViewModel } from '@core/BaseViewModel';
import { observable, observableArray, pureComputed } from 'knockout';
import type { ExerciseType, Operation } from '@core/QuestionGenerator';

type Difficulty = 'facile' | 'moyen' | 'difficile';
type ExerciseCategory = 'calcul' | 'nombres' | 'rapidite' | 'logique';

interface ExerciseInfo {
    id: ExerciseType;
    label: string;
    description: string;
    category: ExerciseCategory;
}

const DIFFICULTY_MAX: Record<Difficulty, number> = {
    facile: 6,
    moyen: 11,
    difficile: 20,
};

const CATEGORIES: ExerciseCategory[] = [
    'calcul',
    'nombres',
    'rapidite',
    'logique',
];

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
    calcul: '🎯 Calcul',
    nombres: '🔢 Sens des nombres',
    rapidite: '⚡ Rapidité',
    logique: '🧠 Logique',
};

// Reuses the existing tone-colored top border from the "tables" feature cards.
const CATEGORY_TONES: Record<ExerciseCategory, string> = {
    calcul: 'addition',
    nombres: 'tables',
    rapidite: 'multiplication',
    logique: 'general',
};

const EXERCISE_INFOS: ExerciseInfo[] = [
    {
        id: 'classic',
        label: 'Quiz classique',
        description: 'Choisis la bonne réponse parmi 4 propositions.',
        category: 'calcul',
    },
    {
        id: 'missing-number',
        label: 'Nombre manquant',
        description: "Trouve le nombre caché dans l'opération.",
        category: 'calcul',
    },
    {
        id: 'true-false',
        label: 'Vrai ou faux',
        description: 'Vérifie si le résultat affiché est correct.',
        category: 'calcul',
    },
    {
        id: 'inverse',
        label: 'Opération inverse',
        description: "Retrouve l'opération qui donne ce résultat.",
        category: 'calcul',
    },
    {
        id: 'free-input',
        label: 'Saisie libre',
        description: 'Tape toi-même la réponse, sans choix multiple.',
        category: 'calcul',
    },
    {
        id: 'operation-sense',
        label: 'Sens des opérations',
        description:
            'Visualise une multiplication (quadrillage) ou un partage (division).',
        category: 'calcul',
    },
    {
        id: 'place-value',
        label: 'Valeur de position',
        description: "Identifie la position ou la valeur d'un chiffre.",
        category: 'nombres',
    },
    {
        id: 'decomposition',
        label: 'Décomposition des nombres',
        description: "Complète la décomposition d'un nombre.",
        category: 'nombres',
    },
    {
        id: 'rounding',
        label: 'Arrondissement',
        description:
            'Arrondis un nombre à la dizaine, centaine ou millier près.',
        category: 'nombres',
    },
    {
        id: 'ordering',
        label: 'Ordonner les nombres',
        description: 'Trouve le plus grand ou le plus petit nombre.',
        category: 'nombres',
    },
    {
        id: 'units',
        label: 'Unités de mesure',
        description: 'Convertis entre unités de mesure (km, kg, L...).',
        category: 'nombres',
    },
    {
        id: 'decimals',
        label: 'Nombres décimaux',
        description: 'Compare des nombres à virgule.',
        category: 'nombres',
    },
    {
        id: 'fractions',
        label: 'Fractions',
        description: 'Identifie la fraction représentée par le dessin.',
        category: 'nombres',
    },
    {
        id: 'number-line',
        label: 'Droite numérique',
        description: 'Retrouve le nombre pointé sur la droite graduée.',
        category: 'nombres',
    },
    {
        id: 'chrono',
        label: 'Défi chrono',
        description: 'Réponds à un maximum de questions en 60 secondes.',
        category: 'rapidite',
    },
    {
        id: 'duel',
        label: 'Duel de calculs',
        description: "Clique sur l'opération qui donne le plus grand résultat.",
        category: 'rapidite',
    },
    {
        id: 'sprint',
        label: 'Sprint chronométré',
        description: 'Complète toute une table le plus vite possible.',
        category: 'rapidite',
    },
    {
        id: 'table-gaps',
        label: 'Table à compléter',
        description: "Remplis les trous d'une table, sans chrono.",
        category: 'rapidite',
    },
    {
        id: 'comparison',
        label: 'Comparaison rapide',
        description: 'Compare rapidement deux nombres.',
        category: 'logique',
    },
    {
        id: 'sequence',
        label: 'Suites logiques',
        description: 'Trouve la suite logique de nombres.',
        category: 'logique',
    },
];

// Exercises that ignore the "Type d'opération" selector (op is forced to 'general').
// Note: 'operation-sense' is deliberately excluded — it reads `op` directly to
// switch between the multiplication (array) and division (sharing) visual.
const NUMBER_SENSE_EXERCISES: ExerciseType[] = [
    'comparison',
    'sequence',
    'place-value',
    'decomposition',
    'rounding',
    'ordering',
    'units',
    'decimals',
    'fractions',
    'number-line',
];

// The only exercises whose QuestionGenerator functions actually read `table`/`tables`.
// Every other exercise picks its own numbers regardless of table selection.
const TABLE_EXERCISES: ExerciseType[] = [
    'classic',
    'free-input',
    'sprint',
    'table-gaps',
];

const OPERATION_CHOICES: Exclude<Operation, 'general'>[] = [
    'addition',
    'soustraction',
    'multiplication',
    'division',
];

const OPERATION_LABELS: Record<Exclude<Operation, 'general'>, string> = {
    addition: '➕ Addition',
    soustraction: '➖ Soustraction',
    multiplication: '✖️ Multiplication',
    division: '➗ Division',
};

export class TrainingViewModel extends BaseViewModel {
    operations = observableArray<Exclude<Operation, 'general'>>(['addition']);
    exercise = observable<ExerciseType>('classic');
    tables = observableArray<number>([2]);
    difficulty = observable<Difficulty>('moyen');
    category = observable<ExerciseCategory>('calcul');

    categories = CATEGORIES;
    categoryLabels = CATEGORY_LABELS;
    operationChoices = OPERATION_CHOICES;

    visibleExercises = pureComputed(() =>
        EXERCISE_INFOS.filter((e) => e.category === this.category())
    );

    usesTables = pureComputed(() => TABLE_EXERCISES.includes(this.exercise()));

    // Number-sense exercises always force op to 'general' internally, so the
    // operation picker doesn't apply to them.
    usesOperations = pureComputed(
        () => !NUMBER_SENSE_EXERCISES.includes(this.exercise())
    );

    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(this.getTemplate());
    }

    categoryTone(category: ExerciseCategory): string {
        return CATEGORY_TONES[category];
    }

    operationLabel(op: Exclude<Operation, 'general'>): string {
        return OPERATION_LABELS[op];
    }

    selectCategory = (category: ExerciseCategory) => {
        this.category(category);
        const first = EXERCISE_INFOS.find((e) => e.category === category);
        if (first) this.exercise(first.id);
    };

    selectExercise = (info: ExerciseInfo) => {
        this.exercise(info.id);
    };

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
              <div class="col-12" data-bind="visible: usesOperations">
                <label class="form-label fw-bold">
                  Type d'opération
                  <span class="qm-muted ms-1" style="font-weight:400; font-size:0.82rem;" data-bind="visible: operations().length === 0">— choisir au moins une</span>
                  <span class="qm-muted ms-1" style="font-weight:400; font-size:0.82rem;" data-bind="visible: operations().length > 1">— mode mixte</span>
                </label>
                <div class="d-flex flex-wrap gap-2 mb-3" data-bind="foreach: operationChoices">
                  <label class="qm-table-tag qm-table-tag--wide" data-bind="css: { 'qm-table-tag--active': $root.operations().indexOf($data) >= 0 }">
                    <input type="checkbox" style="display:none" data-bind="checked: $root.operations, checkedValue: $data">
                    <span data-bind="text: $root.operationLabel($data)"></span>
                  </label>
                </div>
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

          <div class="mt-4">
            <label class="form-label fw-bold">Type d'exercice</label>
            <div class="d-flex flex-wrap gap-2 mb-3" data-bind="foreach: categories">
              <button type="button" class="btn qm-btn-secondary px-3 py-2"
                      data-bind="text: $root.categoryLabels[$data],
                                 click: function(){ $root.selectCategory($data); },
                                 css: { 'active-tab': $root.category() === $data }"></button>
            </div>
            <div class="row g-2" data-bind="foreach: visibleExercises">
              <div class="col-6 col-md-4">
                <div class="card qm-feature-card qm-table-card h-100"
                     data-bind="attr: { 'data-tone': $root.categoryTone(category) },
                                click: function(){ $root.selectExercise($data); },
                                css: { 'qm-table-card--selected': $root.exercise() === id }">
                  <div class="card-body d-flex flex-column p-3">
                    <div class="fw-bold mb-1" data-bind="text: label"></div>
                    <div class="qm-muted small" data-bind="text: description"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-3" data-bind="visible: usesTables">
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
            <button class="btn qm-btn px-4 py-3" data-bind="click: startTraining, disable: (usesTables() && tables().length === 0) || (usesOperations() && operations().length === 0)">🚀 Commencer</button>
            <a href="/" class="btn qm-btn-secondary px-4 py-3">Annuler</a>
          </div>
        </div>
      </div>
    `;
    }

    startTraining = () => {
        const exercise = this.exercise();
        const usesTables = TABLE_EXERCISES.includes(exercise);
        const tables = this.tables();
        if (usesTables && tables.length === 0) return;
        const needsGeneral = NUMBER_SENSE_EXERCISES.includes(exercise);
        const selectedOps = this.operations();
        if (!needsGeneral && selectedOps.length === 0) return;
        const isMulti = !needsGeneral && selectedOps.length > 1;
        const op = needsGeneral
            ? 'general'
            : isMulti
              ? 'general'
              : selectedOps[0];
        const maxFactor = DIFFICULTY_MAX[this.difficulty()];
        const qs = new URLSearchParams({
            mode: 'training',
            exercise,
            maxFactor: String(maxFactor),
            difficulty: this.difficulty(),
        });
        if (usesTables) qs.set('tables', tables.join(','));
        if (isMulti) qs.set('operations', selectedOps.join(','));
        const path = `/quiz/${op}?${qs.toString()}`;
        if (window.page && typeof window.page.show === 'function') {
            window.page.show(path);
        } else {
            window.location.href = path;
        }
    };
}
