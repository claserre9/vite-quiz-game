import { ProfileStore } from './ProfileStore';
import { readString, writeString } from './LocalStorage';
import type { ExerciseType, Operation } from '../core/QuestionGenerator';

export interface StoredScore {
    score: number;
    total: number;
}

export interface SprintBestTimeResult {
    time: number;
    isNewRecord: boolean;
}

/** Persists best scores and sprint times per profile in localStorage. Pure key/value logic, no UI concerns. */
export class QuizScoreStore {
    static loadBestScore(
        op: Operation,
        exercise: ExerciseType,
        isTraining: boolean,
        table: number | null,
        isMultiTable: boolean
    ): StoredScore | null {
        const key = this.getBestScoreKey(
            op,
            exercise,
            isTraining,
            table,
            isMultiTable
        );
        return this.parseStoredScore(readString(key));
    }

    /**
     * Persists the score if it beats the previous best (by percentage).
     * Returns the score that should now be displayed as "best" (new or previous),
     * or null if there's nothing to display (no localStorage, no previous, not a new best).
     */
    static saveBestScore(
        op: Operation,
        exercise: ExerciseType,
        isTraining: boolean,
        table: number | null,
        isMultiTable: boolean,
        currentScore: number,
        currentTotal: number
    ): StoredScore | null {
        const key = this.getBestScoreKey(
            op,
            exercise,
            isTraining,
            table,
            isMultiTable
        );
        const previous = this.parseStoredScore(readString(key));
        const currentPct = currentTotal > 0 ? currentScore / currentTotal : 0;
        const previousPct = previous ? previous.score / previous.total : 0;

        if (currentPct > previousPct) {
            writeString(key, `${currentScore}/${currentTotal}`);
            return { score: currentScore, total: currentTotal };
        }
        return previous;
    }

    static loadSprintBestTime(
        op: Operation,
        table: number | null
    ): number | null {
        if (table === null) return null;
        const stored = Number(
            readString(this.getSprintTimeKey(op, table)) || '0'
        );
        return stored > 0 ? stored : null;
    }

    /** Persists the elapsed time if it beats the previous best. Caller must only call this for perfect runs. */
    static saveSprintBestTime(
        op: Operation,
        table: number,
        elapsedSeconds: number
    ): SprintBestTimeResult {
        const key = this.getSprintTimeKey(op, table);
        const previous = Number(readString(key) || '0');

        if (previous === 0 || elapsedSeconds < previous) {
            writeString(key, String(elapsedSeconds));
            return { time: elapsedSeconds, isNewRecord: true };
        }
        return { time: previous, isNewRecord: false };
    }

    private static getBestScoreKey(
        op: Operation,
        exercise: ExerciseType,
        isTraining: boolean,
        table: number | null,
        isMultiTable: boolean
    ): string {
        const base = `quiz-math-best:${exercise}:${op}:${isTraining ? 'training' : 'normal'}`;
        const suffix =
            isTraining && table !== null && !isMultiTable ? `:t${table}` : '';
        return ProfileStore.scoreKey(`${base}${suffix}`);
    }

    private static getSprintTimeKey(op: Operation, table: number): string {
        return ProfileStore.scoreKey(`quiz-math-sprint-time:${op}:t${table}`);
    }

    private static parseStoredScore(raw: string | null): StoredScore | null {
        if (!raw) return null;
        if (raw.includes('/')) {
            const [s, t] = raw.split('/').map(Number);
            return isNaN(s) || isNaN(t) || t === 0
                ? null
                : { score: s, total: t };
        }
        const legacy = Number(raw);
        // Legacy scores were stored as a bare number out of NUMBER_OF_QUESTIONS (20).
        return isNaN(legacy) || legacy === 0
            ? null
            : { score: legacy, total: 20 };
    }
}
