import { beforeEach, describe, expect, it } from 'vitest';
import { QuizScoreStore } from '@store/QuizScoreStore.ts';

describe('QuizScoreStore', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    describe('best score', () => {
        it('has no best score initially', () => {
            expect(
                QuizScoreStore.loadBestScore(
                    'addition',
                    'classic',
                    false,
                    null,
                    false
                )
            ).toBeNull();
        });

        it('saves the first score as the best', () => {
            const result = QuizScoreStore.saveBestScore(
                'addition',
                'classic',
                false,
                null,
                false,
                12,
                20
            );
            expect(result).toEqual({ score: 12, total: 20 });
            expect(
                QuizScoreStore.loadBestScore(
                    'addition',
                    'classic',
                    false,
                    null,
                    false
                )
            ).toEqual({ score: 12, total: 20 });
        });

        it('only overwrites the best score when the new percentage is strictly higher', () => {
            QuizScoreStore.saveBestScore(
                'addition',
                'classic',
                false,
                null,
                false,
                15,
                20
            ); // 75%

            const worse = QuizScoreStore.saveBestScore(
                'addition',
                'classic',
                false,
                null,
                false,
                10,
                20
            ); // 50% - should not overwrite
            expect(worse).toEqual({ score: 15, total: 20 });

            const better = QuizScoreStore.saveBestScore(
                'addition',
                'classic',
                false,
                null,
                false,
                18,
                20
            ); // 90% - should overwrite
            expect(better).toEqual({ score: 18, total: 20 });
            expect(
                QuizScoreStore.loadBestScore(
                    'addition',
                    'classic',
                    false,
                    null,
                    false
                )
            ).toEqual({ score: 18, total: 20 });
        });

        it('scopes the key by exercise, operation, training mode, and table (single-table training only)', () => {
            QuizScoreStore.saveBestScore(
                'addition',
                'classic',
                true,
                2,
                false,
                20,
                20
            );
            QuizScoreStore.saveBestScore(
                'addition',
                'classic',
                true,
                3,
                false,
                5,
                20
            );

            expect(
                QuizScoreStore.loadBestScore(
                    'addition',
                    'classic',
                    true,
                    2,
                    false
                )
            ).toEqual({ score: 20, total: 20 });
            expect(
                QuizScoreStore.loadBestScore(
                    'addition',
                    'classic',
                    true,
                    3,
                    false
                )
            ).toEqual({ score: 5, total: 20 });
        });

        it('does not scope by table outside of single-table training mode', () => {
            QuizScoreStore.saveBestScore(
                'addition',
                'classic',
                false,
                2,
                false,
                10,
                20
            );
            expect(
                QuizScoreStore.loadBestScore(
                    'addition',
                    'classic',
                    false,
                    9,
                    false
                )
            ).toEqual({ score: 10, total: 20 });
        });

        it('parses legacy bare-number scores as out of 20', () => {
            const key = 'qm:default:quiz-math-best:classic:addition:normal';
            window.localStorage.setItem(key, '15');
            expect(
                QuizScoreStore.loadBestScore(
                    'addition',
                    'classic',
                    false,
                    null,
                    false
                )
            ).toEqual({ score: 15, total: 20 });
        });
    });

    describe('sprint best time', () => {
        it('has no sprint time initially, and null table means "no record"', () => {
            expect(
                QuizScoreStore.loadSprintBestTime('multiplication', 3)
            ).toBeNull();
            expect(
                QuizScoreStore.loadSprintBestTime('multiplication', null)
            ).toBeNull();
        });

        it('records the first perfect-run time as a new record', () => {
            const result = QuizScoreStore.saveSprintBestTime(
                'multiplication',
                3,
                27
            );
            expect(result).toEqual({ time: 27, isNewRecord: true });
            expect(QuizScoreStore.loadSprintBestTime('multiplication', 3)).toBe(
                27
            );
        });

        it('only replaces the record when the new time is strictly faster', () => {
            QuizScoreStore.saveSprintBestTime('multiplication', 3, 27);

            const slower = QuizScoreStore.saveSprintBestTime(
                'multiplication',
                3,
                40
            );
            expect(slower).toEqual({ time: 27, isNewRecord: false });

            const faster = QuizScoreStore.saveSprintBestTime(
                'multiplication',
                3,
                15
            );
            expect(faster).toEqual({ time: 15, isNewRecord: true });
            expect(QuizScoreStore.loadSprintBestTime('multiplication', 3)).toBe(
                15
            );
        });

        it('scopes sprint times per table', () => {
            QuizScoreStore.saveSprintBestTime('multiplication', 3, 27);
            QuizScoreStore.saveSprintBestTime('multiplication', 7, 60);

            expect(QuizScoreStore.loadSprintBestTime('multiplication', 3)).toBe(
                27
            );
            expect(QuizScoreStore.loadSprintBestTime('multiplication', 7)).toBe(
                60
            );
        });
    });
});
