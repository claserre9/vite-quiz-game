import type { ExerciseType, Operation } from './QuestionGenerator';

export const OPERATIONS: readonly Operation[] = [
    'addition',
    'soustraction',
    'multiplication',
    'division',
    'general',
] as const;

export const EXERCISES: readonly ExerciseType[] = [
    'classic',
    'missing-number',
    'true-false',
    'comparison',
    'chrono',
    'sequence',
    'inverse',
    'duel',
    'free-input',
    'sprint',
    'table-gaps',
    'place-value',
    'decomposition',
    'rounding',
    'ordering',
    'units',
    'decimals',
    'fractions',
    'number-line',
    'operation-sense',
] as const;

export const EXERCISE_LABELS: Record<ExerciseType, string> = {
    classic: 'Quiz classique',
    'missing-number': 'Nombre manquant',
    'true-false': 'Vrai ou faux',
    comparison: 'Comparaison rapide',
    chrono: 'Défi chrono',
    sequence: 'Suites logiques',
    inverse: 'Opération inverse',
    duel: 'Duel de calculs',
    'free-input': 'Saisie libre',
    sprint: 'Sprint chronométré',
    'table-gaps': 'Table à compléter',
    'place-value': 'Valeur de position',
    decomposition: 'Décomposition des nombres',
    rounding: 'Arrondissement',
    ordering: 'Ordonner les nombres',
    units: 'Unités de mesure',
    decimals: 'Nombres décimaux',
    fractions: 'Fractions',
    'number-line': 'Droite numérique',
    'operation-sense': 'Sens des opérations',
};

export const FREE_INPUT_EXERCISES: readonly ExerciseType[] = [
    'free-input',
    'sprint',
    'table-gaps',
];
