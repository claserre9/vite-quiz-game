import { observable } from 'knockout';

export type Operation =
    | 'addition'
    | 'soustraction'
    | 'multiplication'
    | 'division'
    | 'general';
export type ExerciseType =
    | 'classic'
    | 'missing-number'
    | 'true-false'
    | 'comparison'
    | 'chrono'
    | 'sequence'
    | 'inverse'
    | 'duel'
    | 'free-input'
    | 'sprint'
    | 'table-gaps'
    | 'place-value'
    | 'decomposition'
    | 'rounding'
    | 'ordering'
    | 'units'
    | 'decimals'
    | 'fractions'
    | 'number-line'
    | 'operation-sense';

export interface Answer {
    answer: string;
    correct: boolean;
}

export interface Question {
    question: string;
    answers: Answer[];
    selectedAnswer: KnockoutObservable<Answer | null>;
    /** Expected string value for free-input exercises */
    correctValue?: string;
    /** Identifies the underlying fact (e.g. "7 × 8") so results can be tracked across sessions */
    fact?: Fact;
    /** Describes a small illustration to render alongside the question (fraction bar, number line, array...) */
    visual?: QuestionVisual;
}

/** Data-only description of a question's visual aid; QuizViewModel renders the actual markup. */
export type QuestionVisual =
    | { type: 'fraction-bar'; total: number; filled: number }
    | {
          type: 'number-line';
          min: number;
          max: number;
          step: number;
          point: number;
      }
    | { type: 'array'; rows: number; cols: number }
    | { type: 'groups'; total: number; groups: number };

export interface Fact {
    op: Exclude<Operation, 'general'>;
    key: string;
}

/** Minimal per-fact history used to weight question selection toward weak spots */
export interface FactStat {
    wrong: number;
    correct: number;
}

export interface GenerateOptions {
    count?: number;
    table?: number | null;
    tables?: number[] | null;
    maxFactor?: number | null;
    /** Per-operation fact history, used to bias generation toward facts the learner struggles with */
    factRecords?: Partial<
        Record<Exclude<Operation, 'general'>, Record<string, FactStat>>
    >;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function generateQuestions(
    op: Operation,
    exercise: ExerciseType,
    options: GenerateOptions = {}
): Question[] {
    const count = options.count ?? 20;
    const tables = options.tables;

    // When a tables array is given and no explicit table is set, use the first entry
    const resolvedOptions: GenerateOptions =
        tables && tables.length > 0 && options.table == null
            ? { ...options, table: tables[0] }
            : options;

    // Multi-table: generate proportional batches per table then mix
    if (
        tables &&
        tables.length > 1 &&
        exercise !== 'sprint' &&
        exercise !== 'table-gaps'
    ) {
        const perTable = Math.ceil(count / tables.length);
        const all: Question[] = [];
        for (const t of tables) {
            const tableOpts: GenerateOptions = {
                ...resolvedOptions,
                table: t,
                tables: null,
                count: perTable,
            };
            all.push(...generateQuestions(op, exercise, tableOpts));
        }
        return shuffleArray(all).slice(0, count);
    }

    switch (exercise) {
        case 'classic':
            return shuffleArray(
                generateClassicQuestions(op, resolvedOptions)
            ).slice(0, count);
        case 'missing-number':
            return generateMissingNumberQuestions(op, count, resolvedOptions);
        case 'true-false':
            return generateTrueFalseQuestions(op, count, resolvedOptions);
        case 'comparison':
            return generateComparisonQuestions(count);
        case 'chrono':
            return generateChronoQuestions(op, count, resolvedOptions);
        case 'sequence':
            return generateSequenceQuestions(count);
        case 'inverse':
            return generateInverseQuestions(op, count, resolvedOptions);
        case 'duel':
            return generateDuelQuestions(op, count, resolvedOptions);
        case 'free-input':
            return generateFreeInputQuestions(op, resolvedOptions);
        case 'sprint':
            return generateSprintQuestions(op, resolvedOptions);
        case 'table-gaps':
            return generateTableGapsQuestions(op, resolvedOptions);
        case 'place-value':
            return generatePlaceValueQuestions(count, resolvedOptions);
        case 'decomposition':
            return generateDecompositionQuestions(count, resolvedOptions);
        case 'rounding':
            return generateRoundingQuestions(count, resolvedOptions);
        case 'ordering':
            return generateOrderingQuestions(count, resolvedOptions);
        case 'units':
            return generateUnitsQuestions(count, resolvedOptions);
        case 'decimals':
            return generateDecimalsQuestions(count, resolvedOptions);
        case 'fractions':
            return generateFractionQuestions(count, resolvedOptions);
        case 'number-line':
            return generateNumberLineQuestions(count, resolvedOptions);
        case 'operation-sense':
            return generateOperationSenseQuestions(op, count, resolvedOptions);
    }
}

// ---------------------------------------------------------------------------
// Classic (table drill)
// ---------------------------------------------------------------------------

function generateClassicQuestions(
    op: Operation,
    options: GenerateOptions
): Question[] {
    const safeOp = op === 'general' ? 'addition' : op;
    const t = options.table ?? randomInt(2, 12);
    const max = options.maxFactor ?? (safeOp === 'multiplication' ? 12 : 20);
    const qs: Question[] = [];

    if (safeOp === 'multiplication') {
        for (let n = 1; n <= max; n++)
            qs.push(
                makeChoiceQuestion(`${t} × ${n} = ?`, t * n, {
                    op: safeOp,
                    key: canonPair(t, n, true),
                })
            );
    } else if (safeOp === 'addition') {
        for (let n = 1; n <= max; n++)
            qs.push(
                makeChoiceQuestion(`${t} + ${n} = ?`, t + n, {
                    op: safeOp,
                    key: canonPair(t, n, true),
                })
            );
    } else if (safeOp === 'division') {
        for (let n = 1; n <= max; n++)
            qs.push(
                makeChoiceQuestion(`${t * n} ÷ ${t} = ?`, n, {
                    op: safeOp,
                    key: canonPair(t * n, t, false),
                })
            );
    } else {
        for (let n = 1; n <= max; n++) {
            const a = t + n;
            qs.push(
                makeChoiceQuestion(`${a} − ${t} = ?`, a - t, {
                    op: safeOp,
                    key: canonPair(a, t, false),
                })
            );
        }
    }

    return qs;
}

// ---------------------------------------------------------------------------
// Missing number
// ---------------------------------------------------------------------------

function generateMissingNumberQuestions(
    op: Operation,
    count: number,
    options: GenerateOptions = {}
): Question[] {
    const safeOp = op === 'general' ? 'addition' : op;
    const max = options.maxFactor ?? (safeOp === 'multiplication' ? 12 : 20);
    const records = options.factRecords?.[safeOp];
    const candidates: Candidate[] = [];

    for (let i = 0; i < oversampleCount(count); i++) {
        const a = randomInt(1, max);
        const b = randomInt(1, max);
        let question: Question;
        let key: string;

        if (safeOp === 'addition') {
            const total = a + b;
            const missingFirst = Math.random() < 0.5;
            key = canonPair(a, b, true);
            question = makeChoiceQuestion(
                missingFirst ? `❓ + ${b} = ${total}` : `${a} + ❓ = ${total}`,
                missingFirst ? a : b,
                { op: safeOp, key }
            );
        } else if (safeOp === 'soustraction') {
            const total = a + b;
            const missingFirst = Math.random() < 0.5;
            key = canonPair(total, a, false);
            question = makeChoiceQuestion(
                missingFirst ? `❓ − ${a} = ${b}` : `${total} − ❓ = ${b}`,
                missingFirst ? total : a,
                { op: safeOp, key }
            );
        } else if (safeOp === 'division') {
            const { a: dividend, b: divisor } = divPair(max);
            const quotient = dividend / divisor;
            const variant = randomInt(0, 2);
            key = canonPair(dividend, divisor, false);
            question = makeChoiceQuestion(
                variant === 0
                    ? `❓ ÷ ${divisor} = ${quotient}`
                    : variant === 1
                      ? `${dividend} ÷ ❓ = ${quotient}`
                      : `${dividend} ÷ ${divisor} = ❓`,
                variant === 0 ? dividend : variant === 1 ? divisor : quotient,
                { op: safeOp, key }
            );
        } else {
            const total = a * b;
            const missingFirst = Math.random() < 0.5;
            key = canonPair(a, b, true);
            question = makeChoiceQuestion(
                missingFirst ? `❓ × ${b} = ${total}` : `${a} × ❓ = ${total}`,
                missingFirst ? a : b,
                { op: safeOp, key }
            );
        }

        candidates.push({ item: question, weight: factWeight(records, key) });
    }

    return selectWithWeakBias(candidates, count);
}

// ---------------------------------------------------------------------------
// True / false
// ---------------------------------------------------------------------------

function generateTrueFalseQuestions(
    op: Operation,
    count: number,
    options: GenerateOptions = {}
): Question[] {
    const safeOp = op === 'general' ? 'addition' : op;
    const max = options.maxFactor ?? (safeOp === 'multiplication' ? 12 : 20);
    const records = options.factRecords?.[safeOp];
    const candidates: Candidate[] = [];

    for (let i = 0; i < oversampleCount(count); i++) {
        const isDivision = safeOp === 'division';
        const pair = isDivision ? divPair(max) : null;
        const a = pair ? pair.a : randomInt(1, max);
        const b = pair
            ? pair.b
            : safeOp === 'soustraction'
              ? randomInt(1, a)
              : randomInt(1, max);
        const correctResult = calculate(a, b, safeOp);
        const shouldBeTrue = Math.random() < 0.5;
        const shownResult = shouldBeTrue
            ? correctResult
            : correctResult + randomNonZeroDelta(1, 4);
        const key = canonPair(
            a,
            b,
            safeOp !== 'soustraction' && safeOp !== 'division'
        );

        candidates.push({
            item: {
                question: `${renderExpression(a, b, safeOp)} = ${shownResult}`,
                answers: shuffleArray([
                    {
                        answer: '✅ Vrai',
                        correct: shownResult === correctResult,
                    },
                    {
                        answer: '❌ Faux',
                        correct: shownResult !== correctResult,
                    },
                ]),
                selectedAnswer: observable<Answer | null>(null),
                fact: { op: safeOp, key },
            },
            weight: factWeight(records, key),
        });
    }

    return selectWithWeakBias(candidates, count);
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

function generateComparisonQuestions(count: number): Question[] {
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const left = randomInt(10, 199);
        const right = Math.random() < 0.2 ? left : randomInt(10, 199);
        let correct = '⬅️ Gauche';
        if (right > left) correct = '➡️ Droite';
        if (left === right) correct = '🤝 Égal';

        questions.push({
            question: `Quel nombre est le plus grand ? ${left}   vs   ${right}`,
            answers: shuffleArray([
                { answer: '⬅️ Gauche', correct: correct === '⬅️ Gauche' },
                { answer: '➡️ Droite', correct: correct === '➡️ Droite' },
                { answer: '🤝 Égal', correct: correct === '🤝 Égal' },
            ]),
            selectedAnswer: observable<Answer | null>(null),
        });
    }

    return questions;
}

// ---------------------------------------------------------------------------
// Chrono
// ---------------------------------------------------------------------------

function generateChronoQuestions(
    op: Operation,
    count: number,
    options: GenerateOptions = {}
): Question[] {
    const candidates: Candidate[] = [];

    for (let i = 0; i < oversampleCount(count); i++) {
        const currentOp: Exclude<Operation, 'general'> =
            op === 'general' ? randomOperation() : op;
        const max =
            options.maxFactor ?? (currentOp === 'multiplication' ? 12 : 20);
        const pair = currentOp === 'division' ? divPair(max) : null;
        const a = pair ? pair.a : randomInt(1, max);
        const b = pair
            ? pair.b
            : currentOp === 'soustraction'
              ? randomInt(1, a)
              : randomInt(1, max);
        const key = canonPair(
            a,
            b,
            currentOp !== 'soustraction' && currentOp !== 'division'
        );
        const records = options.factRecords?.[currentOp];

        candidates.push({
            item: makeChoiceQuestion(
                renderOperation(a, b, currentOp),
                calculate(a, b, currentOp),
                { op: currentOp, key }
            ),
            weight: factWeight(records, key),
        });
    }

    return selectWithWeakBias(candidates, count);
}

// ---------------------------------------------------------------------------
// Sequence
// ---------------------------------------------------------------------------

function generateSequenceQuestions(count: number): Question[] {
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const kind = randomInt(0, 2);
        const start = randomInt(2, 18);
        const step = randomInt(2, 6);

        if (kind === 0) {
            const seq = [
                start,
                start + step,
                start + step * 2,
                start + step * 3,
            ];
            questions.push(
                makeChoiceQuestion(
                    `Complète la suite : ${seq[0]}, ${seq[1]}, ${seq[2]}, ?`,
                    seq[3]
                )
            );
        } else if (kind === 1) {
            const ratio = randomInt(2, 4);
            const seq = [
                start,
                start * ratio,
                start * ratio ** 2,
                start * ratio ** 3,
            ];
            questions.push(
                makeChoiceQuestion(
                    `Complète la suite : ${seq[0]}, ${seq[1]}, ${seq[2]}, ?`,
                    seq[3]
                )
            );
        } else {
            const seq = [start, start + 2, start + 6, start + 12];
            questions.push(
                makeChoiceQuestion(
                    `Trouve le prochain nombre : ${seq[0]}, ${seq[1]}, ${seq[2]}, ${seq[3]}, ?`,
                    start + 20
                )
            );
        }
    }

    return questions;
}

// ---------------------------------------------------------------------------
// Inverse — given a result, find the operation that produced it
// ---------------------------------------------------------------------------

function generateInverseQuestions(
    op: Operation,
    count: number,
    options: GenerateOptions = {}
): Question[] {
    const safeOp = op === 'general' ? randomOperation() : op;
    const symbol = operationSymbol(safeOp);
    const max = options.maxFactor ?? (safeOp === 'multiplication' ? 10 : 15);
    const records = options.factRecords?.[safeOp];
    const candidates: Candidate[] = [];

    for (let i = 0; i < oversampleCount(count); i++) {
        const isPairOp = safeOp === 'division';
        const mainPair = isPairOp
            ? divPair(max)
            : { a: randomInt(1, max), b: randomInt(1, max) };
        const a = mainPair.a;
        const b = mainPair.b;
        const result = calculate(a, b, safeOp);
        const correctExpr = `${a} ${symbol} ${b}`;
        const key = canonPair(
            a,
            b,
            safeOp === 'addition' || safeOp === 'multiplication'
        );

        const distractors: string[] = [];
        const usedResults = new Set([result]);
        let attempts = 0;
        while (distractors.length < 3 && attempts < 60) {
            attempts++;
            const dp = isPairOp
                ? divPair(max)
                : { a: randomInt(1, max), b: randomInt(1, max) };
            const da = dp.a;
            const db = dp.b;
            const dr = calculate(da, db, safeOp);
            const dExpr = `${da} ${symbol} ${db}`;
            if (!usedResults.has(dr) && dExpr !== correctExpr) {
                distractors.push(dExpr);
                usedResults.add(dr);
            }
        }

        candidates.push({
            item: {
                question: `${result} = ?`,
                answers: shuffleArray([
                    { answer: correctExpr, correct: true },
                    ...distractors.map((d) => ({ answer: d, correct: false })),
                ]),
                selectedAnswer: observable<Answer | null>(null),
                fact: { op: safeOp, key },
            },
            weight: factWeight(records, key),
        });
    }

    return selectWithWeakBias(candidates, count);
}

// ---------------------------------------------------------------------------
// Duel — two operations, click the one with the bigger result
// ---------------------------------------------------------------------------

function generateDuelQuestions(
    op: Operation,
    count: number,
    options: GenerateOptions = {}
): Question[] {
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const currentOp: Exclude<Operation, 'general'> =
            op === 'general' ? randomOperation() : op;
        const symbol = operationSymbol(currentOp);
        const max =
            options.maxFactor ?? (currentOp === 'multiplication' ? 10 : 20);
        const isDivision = currentOp === 'division';

        const p1 = isDivision
            ? divPair(max)
            : { a: randomInt(1, max), b: randomInt(1, max) };
        const p2 = isDivision
            ? divPair(max)
            : { a: randomInt(1, max), b: randomInt(1, max) };
        const a1 = p1.a;
        const b1 = p1.b;
        const a2 = p2.a;
        const b2 = p2.b;

        const r1 = calculate(a1, b1, currentOp);
        const r2 = calculate(a2, b2, currentOp);

        const expr1 = `${a1} ${symbol} ${b1}`;
        const expr2 = `${a2} ${symbol} ${b2}`;

        // Avoid identical expressions
        if (expr1 === expr2) {
            i--;
            continue;
        }

        questions.push({
            question: `Lequel donne le plus grand résultat ?\n${expr1}   vs   ${expr2}`,
            answers: [
                { answer: `⬅️  ${expr1}`, correct: r1 > r2 },
                { answer: `➡️  ${expr2}`, correct: r2 > r1 },
                { answer: '🤝 Égal', correct: r1 === r2 },
            ],
            selectedAnswer: observable<Answer | null>(null),
        });
    }

    return questions;
}

// ---------------------------------------------------------------------------
// Free input — type the answer instead of clicking a button
// ---------------------------------------------------------------------------

function generateFreeInputQuestions(
    op: Operation,
    options: GenerateOptions
): Question[] {
    const safeOp = op === 'general' ? 'addition' : op;
    const t = options.table ?? randomInt(2, 12);
    const max = options.maxFactor ?? (safeOp === 'multiplication' ? 12 : 20);
    const count = options.count ?? 20;
    const records = options.factRecords?.[safeOp];
    const candidates: Candidate[] = [];

    for (let i = 0; i < oversampleCount(count); i++) {
        const n = randomInt(1, max);
        let key: string;
        let question: Question;
        if (safeOp === 'multiplication') {
            key = canonPair(t, n, true);
            question = makeFreeInputQuestion(`${t} × ${n} = ?`, String(t * n), {
                op: safeOp,
                key,
            });
        } else if (safeOp === 'addition') {
            key = canonPair(t, n, true);
            question = makeFreeInputQuestion(`${t} + ${n} = ?`, String(t + n), {
                op: safeOp,
                key,
            });
        } else if (safeOp === 'division') {
            key = canonPair(t * n, t, false);
            question = makeFreeInputQuestion(`${t * n} ÷ ${t} = ?`, String(n), {
                op: safeOp,
                key,
            });
        } else {
            const a = t + n;
            key = canonPair(a, t, false);
            question = makeFreeInputQuestion(`${a} − ${t} = ?`, String(n), {
                op: safeOp,
                key,
            });
        }

        candidates.push({ item: question, weight: factWeight(records, key) });
    }

    return selectWithWeakBias(candidates, count);
}

// ---------------------------------------------------------------------------
// Sprint — full table in order, free input, count-up timer
// ---------------------------------------------------------------------------

export function generateSprintQuestions(
    op: Operation,
    options: GenerateOptions
): Question[] {
    const safeOp = op === 'general' ? 'multiplication' : op;
    const t = options.table ?? randomInt(2, 10);
    const max = options.maxFactor ?? 10;
    const qs: Question[] = [];

    for (let n = 1; n <= max; n++) {
        if (safeOp === 'multiplication') {
            qs.push(
                makeFreeInputQuestion(`${t} × ${n} = ?`, String(t * n), {
                    op: safeOp,
                    key: canonPair(t, n, true),
                })
            );
        } else if (safeOp === 'addition') {
            qs.push(
                makeFreeInputQuestion(`${t} + ${n} = ?`, String(t + n), {
                    op: safeOp,
                    key: canonPair(t, n, true),
                })
            );
        } else if (safeOp === 'division') {
            qs.push(
                makeFreeInputQuestion(`${t * n} ÷ ${t} = ?`, String(n), {
                    op: safeOp,
                    key: canonPair(t * n, t, false),
                })
            );
        } else {
            const a = t + n;
            qs.push(
                makeFreeInputQuestion(`${a} − ${t} = ?`, String(n), {
                    op: safeOp,
                    key: canonPair(a, t, false),
                })
            );
        }
    }

    return qs; // ordered, not shuffled
}

// ---------------------------------------------------------------------------
// Table gaps — full table in order, free input, grid visualization
// ---------------------------------------------------------------------------

export function generateTableGapsQuestions(
    op: Operation,
    options: GenerateOptions
): Question[] {
    // Same generation as sprint — the difference is in the UI (grid display, no timer)
    return generateSprintQuestions(op, options);
}

// ---------------------------------------------------------------------------
// Number sense — place value, decomposition, rounding, ordering, units, decimals.
// These don't depend on an operation, so `op` is ignored (mirrors comparison/sequence).
// ---------------------------------------------------------------------------

const POSITION_NAMES = ['unités', 'dizaines', 'centaines', 'milliers'];
const ROUND_PHRASES: Record<number, string> = {
    10: 'à la dizaine près',
    100: 'à la centaine près',
    1000: 'au millier près',
};

function generatePlaceValueQuestions(
    count: number,
    options: GenerateOptions = {}
): Question[] {
    const digits = digitsForMaxFactor(options.maxFactor);
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const n = randomNumberWithDigits(digits);
        const posIdx = randomInt(0, digits - 1);
        const digit = digitAt(n, posIdx);
        const askValue = digit > 0 && Math.random() < 0.5;

        if (askValue) {
            const value = digit * Math.pow(10, posIdx);
            questions.push(
                makeChoiceQuestion(
                    `Quelle est la valeur du chiffre ${digit} dans le nombre ${n} ?`,
                    value
                )
            );
        } else {
            questions.push({
                question: `Quel chiffre est à la position des ${POSITION_NAMES[posIdx]} dans le nombre ${n} ?`,
                answers: shuffleArray([
                    { answer: `🎈 ${digit}`, correct: true },
                    ...buildDigitDistractors(digit).map((d) => ({
                        answer: `🎈 ${d}`,
                        correct: false,
                    })),
                ]),
                selectedAnswer: observable<Answer | null>(null),
            });
        }
    }

    return questions;
}

function generateDecompositionQuestions(
    count: number,
    options: GenerateOptions = {}
): Question[] {
    const digits = digitsForMaxFactor(options.maxFactor);
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const n = randomNumberWithDigits(digits, true);
        const digitChars = String(n).split('');
        const terms = digitChars.map(
            (d, idx) => Number(d) * Math.pow(10, digitChars.length - 1 - idx)
        );
        const blankIdx = randomInt(0, terms.length - 1);
        const expression = terms
            .map((t, idx) => (idx === blankIdx ? '❓' : String(t)))
            .join(' + ');

        questions.push(
            makeChoiceQuestion(`${expression} = ${n}`, terms[blankIdx])
        );
    }

    return questions;
}

function generateRoundingQuestions(
    count: number,
    options: GenerateOptions = {}
): Question[] {
    const digits = digitsForMaxFactor(options.maxFactor);
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const n = randomNumberWithDigits(digits);
        const roundTo = pickRoundTo(digits);
        const rounded = Math.round(n / roundTo) * roundTo;

        const distractors = new Set<number>([
            Math.max(0, rounded - roundTo),
            rounded + roundTo,
        ]);
        if (n !== rounded) distractors.add(n);
        let extra = roundTo * 2;
        while (distractors.size < 3) {
            distractors.add(rounded + extra);
            extra += roundTo;
        }
        distractors.delete(rounded);

        questions.push({
            question: `Arrondis ${n} ${ROUND_PHRASES[roundTo]}.`,
            answers: shuffleArray([
                { answer: `🎈 ${rounded}`, correct: true },
                ...Array.from(distractors)
                    .slice(0, 3)
                    .map((d) => ({ answer: `🎈 ${d}`, correct: false })),
            ]),
            selectedAnswer: observable<Answer | null>(null),
        });
    }

    return questions;
}

function generateOrderingQuestions(
    count: number,
    options: GenerateOptions = {}
): Question[] {
    const digits = digitsForMaxFactor(options.maxFactor);
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const numbers = new Set<number>();
        while (numbers.size < 4) {
            numbers.add(randomNumberWithDigits(digits));
        }
        const values = Array.from(numbers);
        const askMax = Math.random() < 0.5;
        const target = askMax ? Math.max(...values) : Math.min(...values);

        questions.push({
            question: askMax
                ? 'Quel est le plus grand nombre ?'
                : 'Quel est le plus petit nombre ?',
            answers: shuffleArray(
                values.map((v) => ({
                    answer: `🎈 ${v}`,
                    correct: v === target,
                }))
            ),
            selectedAnswer: observable<Answer | null>(null),
        });
    }

    return questions;
}

interface UnitConversion {
    from: string;
    to: string;
    factor: number;
}

const UNIT_CONVERSIONS: UnitConversion[] = [
    { from: 'km', to: 'm', factor: 1000 },
    { from: 'm', to: 'cm', factor: 100 },
    { from: 'cm', to: 'mm', factor: 10 },
    { from: 'kg', to: 'g', factor: 1000 },
    { from: 'L', to: 'mL', factor: 1000 },
];

function generateUnitsQuestions(
    count: number,
    options: GenerateOptions = {}
): Question[] {
    const maxN = unitsMaxN(options.maxFactor);
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const conv =
            UNIT_CONVERSIONS[randomInt(0, UNIT_CONVERSIONS.length - 1)];
        const n = randomInt(1, maxN);

        questions.push(
            makeChoiceQuestion(
                `${n} ${conv.from} = combien de ${conv.to} ?`,
                n * conv.factor
            )
        );
    }

    return questions;
}

function generateDecimalsQuestions(
    count: number,
    options: GenerateOptions = {}
): Question[] {
    const magnitude = decimalMagnitude(options.maxFactor);
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const left = randomDecimal(magnitude);
        const right = Math.random() < 0.2 ? left : randomDecimal(magnitude);
        let correct = '⬅️ Gauche';
        if (right > left) correct = '➡️ Droite';
        if (left === right) correct = '🤝 Égal';

        questions.push({
            question: `Quel nombre est le plus grand ? ${formatDecimal(left)}   vs   ${formatDecimal(right)}`,
            answers: shuffleArray([
                { answer: '⬅️ Gauche', correct: correct === '⬅️ Gauche' },
                { answer: '➡️ Droite', correct: correct === '➡️ Droite' },
                { answer: '🤝 Égal', correct: correct === '🤝 Égal' },
            ]),
            selectedAnswer: observable<Answer | null>(null),
        });
    }

    return questions;
}

// ---------------------------------------------------------------------------
// Fractions — visual bar representation
// ---------------------------------------------------------------------------

function generateFractionQuestions(
    count: number,
    options: GenerateOptions = {}
): Question[] {
    const denominators = fractionDenominators(options.maxFactor);
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const total = denominators[randomInt(0, denominators.length - 1)];
        const filled = randomInt(1, total - 1);
        const correct = `${filled}/${total}`;

        const distractors = new Set<string>();
        if (filled - 1 >= 1) distractors.add(`${filled - 1}/${total}`);
        if (filled + 1 <= total - 1) distractors.add(`${filled + 1}/${total}`);
        distractors.add(`${Math.min(filled, total)}/${total + 1}`);
        if (total - 1 > filled) distractors.add(`${filled}/${total - 1}`);
        distractors.delete(correct);

        let dTotal = total;
        while (distractors.size < 3) {
            dTotal = dTotal >= 2 ? dTotal + 1 : 2;
            const dFilled = randomInt(1, dTotal - 1);
            const candidate = `${dFilled}/${dTotal}`;
            if (candidate !== correct) distractors.add(candidate);
        }

        questions.push({
            question: 'Quelle fraction est représentée ci-dessus ?',
            answers: shuffleArray([
                { answer: correct, correct: true },
                ...Array.from(distractors)
                    .slice(0, 3)
                    .map((d) => ({ answer: d, correct: false })),
            ]),
            selectedAnswer: observable<Answer | null>(null),
            visual: { type: 'fraction-bar', total, filled },
        });
    }

    return questions;
}

// ---------------------------------------------------------------------------
// Number line — locate a point on a graduated line
// ---------------------------------------------------------------------------

function generateNumberLineQuestions(
    count: number,
    options: GenerateOptions = {}
): Question[] {
    const steps = numberLineSteps(options.maxFactor);
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const step = steps[randomInt(0, steps.length - 1)];
        const max = step * 10;
        const tickIndex = randomInt(1, 9);
        const point = step * tickIndex;

        const distractorTicks = new Set<number>();
        for (const delta of [-1, 1, -2, 2]) {
            const idx = tickIndex + delta;
            if (idx >= 0 && idx <= 10) distractorTicks.add(step * idx);
        }
        let fallbackIdx = 0;
        while (distractorTicks.size < 3 && fallbackIdx <= 10) {
            if (fallbackIdx !== tickIndex)
                distractorTicks.add(step * fallbackIdx);
            fallbackIdx++;
        }

        questions.push({
            question: 'Quel nombre est représenté par le point sur la droite ?',
            answers: shuffleArray([
                { answer: `🎈 ${point}`, correct: true },
                ...Array.from(distractorTicks)
                    .slice(0, 3)
                    .map((d) => ({ answer: `🎈 ${d}`, correct: false })),
            ]),
            selectedAnswer: observable<Answer | null>(null),
            visual: { type: 'number-line', min: 0, max, step, point },
        });
    }

    return questions;
}

// ---------------------------------------------------------------------------
// Operation sense — array model for multiplication, sharing model for division
// ---------------------------------------------------------------------------

function generateOperationSenseQuestions(
    op: Operation,
    count: number,
    options: GenerateOptions = {}
): Question[] {
    const isDivision = op === 'division';
    const dim = operationSenseDim(options.maxFactor);
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        if (isDivision) {
            const groups = randomInt(2, dim);
            const perGroup = randomInt(2, dim);
            const total = groups * perGroup;

            questions.push(
                makeChoiceQuestion(
                    `On partage ${total} bonbons entre ${groups} amis, à parts égales. Combien chaque ami en aura-t-il ?`,
                    perGroup,
                    undefined,
                    { type: 'groups', total, groups }
                )
            );
        } else {
            const rows = randomInt(2, dim);
            const cols = randomInt(2, dim);

            questions.push(
                makeChoiceQuestion(
                    `Combien y a-t-il de jetons en tout dans ce quadrillage de ${rows} lignes sur ${cols} colonnes ?`,
                    rows * cols,
                    undefined,
                    { type: 'array', rows, cols }
                )
            );
        }
    }

    return questions;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function makeChoiceQuestion(
    question: string,
    correctAnswer: number,
    fact?: Fact,
    visual?: QuestionVisual
): Question {
    return {
        question,
        answers: shuffleArray([
            { answer: `🎈 ${correctAnswer}`, correct: true },
            ...buildDistractors(correctAnswer).map((n) => ({
                answer: `🎈 ${n}`,
                correct: false,
            })),
        ]),
        selectedAnswer: observable<Answer | null>(null),
        fact,
        visual,
    };
}

function makeFreeInputQuestion(
    question: string,
    correctValue: string,
    fact?: Fact
): Question {
    return {
        question,
        answers: [],
        selectedAnswer: observable<Answer | null>(null),
        correctValue,
        fact,
    };
}

// ---------------------------------------------------------------------------
// Weak-fact weighting — biases random question selection toward facts a
// learner has recently gotten wrong, based on per-profile history.
// ---------------------------------------------------------------------------

interface Candidate {
    item: Question;
    weight: number;
}

/** Canonical key identifying a fact. Commutative ops sort operands so order doesn't matter. */
function canonPair(a: number, b: number, commutative: boolean): string {
    if (commutative) {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        return `${lo}:${hi}`;
    }
    return `${a}:${b}`;
}

/** How many extra candidates to generate before selecting `count`, so weak facts have room to surface. */
function oversampleCount(count: number): number {
    return Math.min(count * 3, 90);
}

function factWeight(
    records: Record<string, FactStat> | undefined,
    key: string
): number {
    const rec = records?.[key];
    if (!rec) return 1;
    const attempts = rec.wrong + rec.correct;
    if (attempts === 0) return 1;
    const missRate = rec.wrong / attempts;
    // Ramps up with more evidence, capped so a single miss doesn't dominate.
    return 1 + missRate * 5 * Math.min(1, attempts / 3);
}

/** Weighted sampling without replacement, favoring higher-weight candidates, then shuffles the pick order. */
function selectWithWeakBias(
    candidates: Candidate[],
    count: number
): Question[] {
    if (candidates.length <= count) {
        return shuffleArray(candidates.map((c) => c.item));
    }

    const pool = candidates.slice();
    const result: Question[] = [];

    while (pool.length > 0 && result.length < count) {
        const total = pool.reduce((sum, c) => sum + c.weight, 0);
        let r = Math.random() * total;
        let idx = pool.length - 1;
        for (let i = 0; i < pool.length; i++) {
            r -= pool[i].weight;
            if (r <= 0) {
                idx = i;
                break;
            }
        }
        result.push(pool.splice(idx, 1)[0].item);
    }

    return shuffleArray(result);
}

function buildDistractors(correct: number): number[] {
    const set = new Set<number>();
    const range = Math.max(2, Math.floor(Math.abs(correct) * 0.25) + 2);
    // Bounded relative to `correct` (not a fixed ceiling) so this scales to
    // large answers too (e.g. unit conversions, thousands-place values).
    const lowerBound = Math.min(-100, correct - range * 4);
    let attempts = 0;
    while (set.size < 3 && attempts < 200) {
        attempts++;
        const delta = Math.floor(Math.random() * range) + 1;
        const sign = Math.random() < 0.5 ? -1 : 1;
        const candidate = correct + sign * delta;
        if (candidate !== correct && candidate >= lowerBound) {
            set.add(candidate);
        }
    }
    // Extremely unlikely fallback so this never spins forever.
    let fallback = 1;
    while (set.size < 3) {
        const candidate = correct + fallback++;
        if (candidate !== correct) set.add(candidate);
    }
    return Array.from(set);
}

function calculate(
    a: number,
    b: number,
    op: Exclude<Operation, 'general'>
): number {
    if (op === 'addition') return a + b;
    if (op === 'soustraction') return a - b;
    if (op === 'division') return Math.round(a / b);
    return a * b;
}

/** Returns {a, b} where a ÷ b is always an integer (b is divisor, a = b × quotient). */
function divPair(max: number): { a: number; b: number } {
    const b = randomInt(2, Math.min(max, 10));
    const q = randomInt(1, max);
    return { a: b * q, b };
}

function renderOperation(
    a: number,
    b: number,
    op: Exclude<Operation, 'general'>
): string {
    return `${renderExpression(a, b, op)} = ?`;
}

function renderExpression(
    a: number,
    b: number,
    op: Exclude<Operation, 'general'>
): string {
    return `${a} ${operationSymbol(op)} ${b}`;
}

function operationSymbol(op: Exclude<Operation, 'general'>): string {
    if (op === 'addition') return '+';
    if (op === 'soustraction') return '−';
    if (op === 'division') return '÷';
    return '×';
}

export function shuffleArray<T>(array: T[]): T[] {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomNonZeroDelta(min: number, max: number): number {
    const delta = randomInt(min, max);
    return Math.random() < 0.5 ? -delta : delta;
}

function randomOperation(): Exclude<Operation, 'general'> {
    const ops: Exclude<Operation, 'general'>[] = [
        'addition',
        'soustraction',
        'multiplication',
        'division',
    ];
    return ops[randomInt(0, ops.length - 1)];
}

// ---------------------------------------------------------------------------
// Number sense helpers
// ---------------------------------------------------------------------------

/** Maps the facile/moyen/difficile maxFactor (6/11/20) to a digit count for number-sense exercises. */
function digitsForMaxFactor(max: number | null | undefined): number {
    const m = max ?? 11;
    if (m <= 6) return 2;
    if (m <= 11) return 3;
    return 4;
}

function randomNumberWithDigits(
    digits: number,
    avoidZeroDigits = false
): number {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    let n = randomInt(min, max);
    if (avoidZeroDigits) {
        let attempts = 0;
        while (String(n).includes('0') && attempts < 30) {
            n = randomInt(min, max);
            attempts++;
        }
    }
    return n;
}

function digitAt(n: number, posIdx: number): number {
    return Math.floor(n / Math.pow(10, posIdx)) % 10;
}

function buildDigitDistractors(correct: number): number[] {
    const set = new Set<number>();
    while (set.size < 3) {
        const candidate = randomInt(0, 9);
        if (candidate !== correct) set.add(candidate);
    }
    return Array.from(set);
}

function pickRoundTo(digits: number): number {
    if (digits <= 2) return 10;
    if (digits === 3) return Math.random() < 0.5 ? 10 : 100;
    return [10, 100, 1000][randomInt(0, 2)];
}

function unitsMaxN(max: number | null | undefined): number {
    const m = max ?? 11;
    if (m <= 6) return 10;
    if (m <= 11) return 50;
    return 200;
}

function decimalMagnitude(max: number | null | undefined): number {
    const m = max ?? 11;
    if (m <= 6) return 10;
    if (m <= 11) return 20;
    return 50;
}

function randomDecimal(magnitude: number): number {
    const whole = randomInt(0, magnitude);
    const tenth = randomInt(0, 9);
    return Math.round((whole + tenth / 10) * 10) / 10;
}

function formatDecimal(n: number): string {
    return n.toFixed(1).replace('.', ',');
}

function fractionDenominators(max: number | null | undefined): number[] {
    const m = max ?? 11;
    if (m <= 6) return [2, 3, 4];
    if (m <= 11) return [2, 3, 4, 5, 6, 8];
    return [2, 3, 4, 5, 6, 8, 10, 12];
}

function numberLineSteps(max: number | null | undefined): number[] {
    const m = max ?? 11;
    if (m <= 6) return [1, 2];
    if (m <= 11) return [2, 5, 10];
    return [5, 10, 20, 50];
}

function operationSenseDim(max: number | null | undefined): number {
    const m = max ?? 11;
    if (m <= 6) return 4;
    if (m <= 11) return 6;
    return 8;
}
