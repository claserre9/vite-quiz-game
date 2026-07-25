import { describe, expect, it } from 'vitest';
import {
    generateQuestions,
    shuffleArray,
    type ExerciseType,
    type Operation,
    type Question,
} from '@core/QuestionGenerator.ts';

const OPERATIONS: Operation[] = [
    'addition',
    'soustraction',
    'multiplication',
    'division',
    'general',
];

const EXERCISES: ExerciseType[] = [
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
];

/** A question is valid if it has exactly one correct choice (or a correctValue for free input),
 * and never offers the same answer text twice. */
function assertValidQuestion(question: Question): void {
    if (question.answers.length === 0) {
        expect(question.correctValue).toBeTruthy();
        return;
    }

    const correctAnswers = question.answers.filter((a) => a.correct);
    expect(correctAnswers.length).toBe(1);

    const texts = question.answers.map((a) => a.answer);
    expect(new Set(texts).size).toBe(texts.length);
}

describe('generateQuestions', () => {
    describe.each(EXERCISES)('exercise: %s', (exercise) => {
        it('produces only valid questions across every operation and difficulty', () => {
            for (const op of OPERATIONS) {
                for (const maxFactor of [6, 11, 20]) {
                    const questions = generateQuestions(op, exercise, {
                        count: 8,
                        table: 2,
                        maxFactor,
                    });

                    expect(questions.length).toBeGreaterThan(0);
                    questions.forEach(assertValidQuestion);
                }
            }
        });
    });

    it('never hangs generating large batches of units/place-value questions (regression for the buildDistractors infinite loop)', () => {
        for (const exercise of ['units', 'place-value'] as ExerciseType[]) {
            for (const maxFactor of [6, 11, 20]) {
                const questions = generateQuestions('general', exercise, {
                    count: 50,
                    maxFactor,
                });
                expect(questions.length).toBeGreaterThan(0);
                questions.forEach(assertValidQuestion);
            }
        }
    });

    it('generates a fraction bar whose filled segment count is strictly between 0 and the total', () => {
        const questions = generateQuestions('general', 'fractions', {
            count: 30,
            maxFactor: 11,
        });
        for (const q of questions) {
            expect(q.visual?.type).toBe('fraction-bar');
            if (q.visual?.type !== 'fraction-bar') continue;
            expect(q.visual.filled).toBeGreaterThan(0);
            expect(q.visual.filled).toBeLessThan(q.visual.total);
        }
    });

    it('generates a number-line point strictly between min and max', () => {
        const questions = generateQuestions('general', 'number-line', {
            count: 30,
            maxFactor: 11,
        });
        for (const q of questions) {
            expect(q.visual?.type).toBe('number-line');
            if (q.visual?.type !== 'number-line') continue;
            expect(q.visual.point).toBeGreaterThan(q.visual.min);
            expect(q.visual.point).toBeLessThan(q.visual.max);
        }
    });

    it('generates operation-sense arrays/groups whose visual matches the correct answer', () => {
        const arrayQuestions = generateQuestions(
            'multiplication',
            'operation-sense',
            { count: 20, maxFactor: 11 }
        );
        for (const q of arrayQuestions) {
            expect(q.visual?.type).toBe('array');
            if (q.visual?.type !== 'array') continue;
            const correct = q.answers.find((a) => a.correct);
            expect(correct?.answer).toBe(`🎈 ${q.visual.rows * q.visual.cols}`);
        }

        const groupQuestions = generateQuestions(
            'division',
            'operation-sense',
            {
                count: 20,
                maxFactor: 11,
            }
        );
        for (const q of groupQuestions) {
            expect(q.visual?.type).toBe('groups');
            if (q.visual?.type !== 'groups') continue;
            const correct = q.answers.find((a) => a.correct);
            expect(correct?.answer).toBe(
                `🎈 ${q.visual.total / q.visual.groups}`
            );
        }
    });

    it('biases missing-number/true-false/chrono/inverse/free-input toward facts with a high miss rate', () => {
        const factRecords = {
            multiplication: { '7:8': { wrong: 8, correct: 0 } },
        };

        for (const exercise of [
            'missing-number',
            'true-false',
            'chrono',
            'inverse',
            'free-input',
        ] as ExerciseType[]) {
            const counts: Record<string, number> = {};
            for (let i = 0; i < 80; i++) {
                const questions = generateQuestions(
                    'multiplication',
                    exercise,
                    // `table: 7` is a no-op for missing-number/true-false/chrono/inverse
                    // (they don't read it), but it matters for free-input: it draws its
                    // "table" operand once per whole batch rather than per candidate, so
                    // without pinning it, "7:8" would rarely even appear as a candidate.
                    { count: 20, table: 7, maxFactor: 12, factRecords }
                );
                for (const q of questions) {
                    if (!q.fact) continue;
                    counts[q.fact.key] = (counts[q.fact.key] ?? 0) + 1;
                }
            }

            const values = Object.values(counts);
            const average =
                values.reduce((a, b) => a + b, 0) / (values.length || 1);
            // The weak fact should show up noticeably more than the average fact.
            expect(counts['7:8'] ?? 0).toBeGreaterThan(average * 1.3);
        }
    });

    it('does not bias exhaustive exercises (classic/sprint/table-gaps) — they must still cover every fact', () => {
        const factRecords = {
            multiplication: { '2:1': { wrong: 8, correct: 0 } },
        };

        for (const exercise of [
            'classic',
            'sprint',
            'table-gaps',
        ] as ExerciseType[]) {
            const questions = generateQuestions('multiplication', exercise, {
                table: 2,
                maxFactor: 10,
                factRecords,
            });
            const keys = new Set(
                questions.map((q) => q.fact?.key).filter(Boolean)
            );
            // Every n from 1..10 multiplied by table 2 should be present exactly once.
            expect(keys.size).toBe(10);
        }
    });

    it('sprint and table-gaps always present the full table in ascending order (n = 1..maxFactor)', () => {
        for (const exercise of ['sprint', 'table-gaps'] as ExerciseType[]) {
            const questions = generateQuestions('multiplication', exercise, {
                table: 4,
                maxFactor: 10,
            });
            expect(questions.map((q) => q.question)).toEqual(
                Array.from({ length: 10 }, (_, i) => `4 × ${i + 1} = ?`)
            );
        }
    });

    it('splits a multi-table request proportionally across all requested tables', () => {
        const questions = generateQuestions('multiplication', 'classic', {
            count: 30,
            tables: [2, 3, 4],
            maxFactor: 10,
        });
        expect(questions.length).toBeLessThanOrEqual(30);
        expect(questions.length).toBeGreaterThan(0);
        questions.forEach(assertValidQuestion);
    });

    it('restricts a "general" session to the requested subset of operations', () => {
        for (const exercise of [
            'chrono',
            'duel',
            'missing-number',
            'true-false',
            'inverse',
            'free-input',
        ] as ExerciseType[]) {
            const questions = generateQuestions('general', exercise, {
                count: 30,
                table: 7,
                maxFactor: 10,
                operations: ['addition', 'multiplication'],
            });
            expect(questions.length).toBeGreaterThan(0);
            questions.forEach(assertValidQuestion);
            for (const q of questions) {
                if (!q.fact) continue;
                expect(['addition', 'multiplication']).toContain(q.fact.op);
            }
        }
    });

    it('treats a single-entry operations subset the same as passing that operation directly', () => {
        const questions = generateQuestions('general', 'missing-number', {
            count: 20,
            maxFactor: 10,
            operations: ['division'],
        });
        expect(questions.length).toBeGreaterThan(0);
        for (const q of questions) {
            expect(q.fact?.op).toBe('division');
        }
    });

    it('sprint and table-gaps ignore multi-operation mixing and just use the first requested operation', () => {
        for (const exercise of ['sprint', 'table-gaps'] as ExerciseType[]) {
            const questions = generateQuestions('general', exercise, {
                table: 4,
                maxFactor: 10,
                operations: ['soustraction', 'multiplication'],
            });
            expect(questions.map((q) => q.question)).toEqual(
                Array.from({ length: 10 }, (_, i) => `${4 + (i + 1)} − 4 = ?`)
            );
        }
    });

    it('only exposes a fact for the 4 exercises that actually use table/tables (classic, free-input, sprint, table-gaps)', () => {
        // Sanity-check the docs/tasks.md claim by asking every exercise for table=2 vs table=9
        // and confirming only those four produce different output.
        const tableSensitive: ExerciseType[] = [
            'classic',
            'free-input',
            'sprint',
            'table-gaps',
        ];
        for (const exercise of EXERCISES) {
            const withTable2 = generateQuestions('addition', exercise, {
                count: 5,
                table: 2,
                maxFactor: 6,
            });
            const withTable9 = generateQuestions('addition', exercise, {
                count: 5,
                table: 9,
                maxFactor: 6,
            });
            const differs =
                JSON.stringify(withTable2.map((q) => q.question)) !==
                JSON.stringify(withTable9.map((q) => q.question));

            if (tableSensitive.includes(exercise)) {
                expect(differs).toBe(true);
            }
            // Other exercises are random, so they *may* differ by chance too —
            // we only assert the positive case here to avoid a flaky negative assertion.
        }
    });
});

describe('shuffleArray', () => {
    it('returns an array with the same elements, without mutating the input', () => {
        const input = [1, 2, 3, 4, 5];
        const copy = [...input];
        const shuffled = shuffleArray(input);

        expect(input).toEqual(copy);
        expect(shuffled).toHaveLength(input.length);
        expect([...shuffled].sort()).toEqual([...input].sort());
    });
});
