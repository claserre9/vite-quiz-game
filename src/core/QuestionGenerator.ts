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
    | 'table-gaps';

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
}

export interface GenerateOptions {
    count?: number;
    table?: number | null;
    maxFactor?: number | null;
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

    switch (exercise) {
        case 'classic':
            return shuffleArray(generateClassicQuestions(op, options)).slice(
                0,
                count
            );
        case 'missing-number':
            return generateMissingNumberQuestions(op, count, options);
        case 'true-false':
            return generateTrueFalseQuestions(op, count, options);
        case 'comparison':
            return generateComparisonQuestions(count);
        case 'chrono':
            return generateChronoQuestions(op, count, options);
        case 'sequence':
            return generateSequenceQuestions(count);
        case 'inverse':
            return generateInverseQuestions(op, count, options);
        case 'duel':
            return generateDuelQuestions(op, count, options);
        case 'free-input':
            return generateFreeInputQuestions(op, options);
        case 'sprint':
            return generateSprintQuestions(op, options);
        case 'table-gaps':
            return generateTableGapsQuestions(op, options);
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
            qs.push(makeChoiceQuestion(`${t} × ${n} = ?`, t * n));
    } else if (safeOp === 'addition') {
        for (let n = 1; n <= max; n++)
            qs.push(makeChoiceQuestion(`${t} + ${n} = ?`, t + n));
    } else if (safeOp === 'division') {
        for (let n = 1; n <= max; n++)
            qs.push(makeChoiceQuestion(`${t * n} ÷ ${t} = ?`, n));
    } else {
        for (let n = 1; n <= max; n++) {
            const a = t + n;
            qs.push(makeChoiceQuestion(`${a} − ${t} = ?`, a - t));
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
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const a = randomInt(1, max);
        const b = randomInt(1, max);

        if (safeOp === 'addition') {
            const total = a + b;
            const missingFirst = Math.random() < 0.5;
            questions.push(
                makeChoiceQuestion(
                    missingFirst
                        ? `❓ + ${b} = ${total}`
                        : `${a} + ❓ = ${total}`,
                    missingFirst ? a : b
                )
            );
        } else if (safeOp === 'soustraction') {
            const total = a + b;
            const missingFirst = Math.random() < 0.5;
            questions.push(
                makeChoiceQuestion(
                    missingFirst ? `❓ − ${a} = ${b}` : `${total} − ❓ = ${b}`,
                    missingFirst ? total : a
                )
            );
        } else if (safeOp === 'division') {
            const { a: dividend, b: divisor } = divPair(max);
            const quotient = dividend / divisor;
            const variant = randomInt(0, 2);
            questions.push(
                makeChoiceQuestion(
                    variant === 0
                        ? `❓ ÷ ${divisor} = ${quotient}`
                        : variant === 1
                          ? `${dividend} ÷ ❓ = ${quotient}`
                          : `${dividend} ÷ ${divisor} = ❓`,
                    variant === 0
                        ? dividend
                        : variant === 1
                          ? divisor
                          : quotient
                )
            );
        } else {
            const total = a * b;
            const missingFirst = Math.random() < 0.5;
            questions.push(
                makeChoiceQuestion(
                    missingFirst
                        ? `❓ × ${b} = ${total}`
                        : `${a} × ❓ = ${total}`,
                    missingFirst ? a : b
                )
            );
        }
    }

    return questions;
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
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
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

        questions.push({
            question: `${renderExpression(a, b, safeOp)} = ${shownResult}`,
            answers: shuffleArray([
                { answer: '✅ Vrai', correct: shownResult === correctResult },
                { answer: '❌ Faux', correct: shownResult !== correctResult },
            ]),
            selectedAnswer: observable<Answer | null>(null),
        });
    }

    return questions;
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
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
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
        questions.push(
            makeChoiceQuestion(
                renderOperation(a, b, currentOp),
                calculate(a, b, currentOp)
            )
        );
    }

    return questions;
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
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const isPairOp = safeOp === 'division';
        const mainPair = isPairOp
            ? divPair(max)
            : { a: randomInt(1, max), b: randomInt(1, max) };
        const a = mainPair.a;
        const b = mainPair.b;
        const result = calculate(a, b, safeOp);
        const correctExpr = `${a} ${symbol} ${b}`;

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

        questions.push({
            question: `${result} = ?`,
            answers: shuffleArray([
                { answer: correctExpr, correct: true },
                ...distractors.map((d) => ({ answer: d, correct: false })),
            ]),
            selectedAnswer: observable<Answer | null>(null),
        });
    }

    return questions;
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
    const qs: Question[] = [];

    for (let i = 0; i < count; i++) {
        const n = randomInt(1, max);
        if (safeOp === 'multiplication') {
            qs.push(makeFreeInputQuestion(`${t} × ${n} = ?`, String(t * n)));
        } else if (safeOp === 'addition') {
            qs.push(makeFreeInputQuestion(`${t} + ${n} = ?`, String(t + n)));
        } else if (safeOp === 'division') {
            qs.push(makeFreeInputQuestion(`${t * n} ÷ ${t} = ?`, String(n)));
        } else {
            const a = t + n;
            qs.push(makeFreeInputQuestion(`${a} − ${t} = ?`, String(n)));
        }
    }

    return qs;
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
            qs.push(makeFreeInputQuestion(`${t} × ${n} = ?`, String(t * n)));
        } else if (safeOp === 'addition') {
            qs.push(makeFreeInputQuestion(`${t} + ${n} = ?`, String(t + n)));
        } else if (safeOp === 'division') {
            qs.push(makeFreeInputQuestion(`${t * n} ÷ ${t} = ?`, String(n)));
        } else {
            const a = t + n;
            qs.push(makeFreeInputQuestion(`${a} − ${t} = ?`, String(n)));
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
// Shared helpers
// ---------------------------------------------------------------------------

function makeChoiceQuestion(question: string, correctAnswer: number): Question {
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
    };
}

function makeFreeInputQuestion(
    question: string,
    correctValue: string
): Question {
    return {
        question,
        answers: [],
        selectedAnswer: observable<Answer | null>(null),
        correctValue,
    };
}

function buildDistractors(correct: number): number[] {
    const set = new Set<number>();
    const range = Math.max(2, Math.floor(Math.abs(correct) * 0.25) + 2);
    while (set.size < 3) {
        const delta = Math.floor(Math.random() * range) + 1;
        const sign = Math.random() < 0.5 ? -1 : 1;
        const candidate = correct + sign * delta;
        if (candidate !== correct && candidate >= -100 && candidate <= 1000) {
            set.add(candidate);
        }
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
