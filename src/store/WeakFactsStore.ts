import { ProfileStore } from './ProfileStore';
import { readJson, writeJson } from './LocalStorage';
import type { Operation, FactStat } from '../core/QuestionGenerator';

export type ConcreteOperation = Exclude<Operation, 'general'>;

export interface FactRecord extends FactStat {
    lastSeen: number;
}

const ALL_OPS: ConcreteOperation[] = [
    'addition',
    'soustraction',
    'multiplication',
    'division',
];

/** Tracks per-fact (e.g. "7 × 8") correctness history, scoped to the active profile. */
export class WeakFactsStore {
    static recordResult(
        op: ConcreteOperation,
        factKey: string,
        correct: boolean
    ): void {
        const records = this.getRecords(op);
        const existing = records[factKey] ?? {
            wrong: 0,
            correct: 0,
            lastSeen: 0,
        };
        records[factKey] = {
            wrong: existing.wrong + (correct ? 0 : 1),
            correct: existing.correct + (correct ? 1 : 0),
            lastSeen: Date.now(),
        };
        writeJson(this.key(op), records);
    }

    static getRecords(op: ConcreteOperation): Record<string, FactRecord> {
        return readJson<Record<string, FactRecord>>(this.key(op)) ?? {};
    }

    /** Fetches records for the given operations, keyed by operation. */
    static getRecordsForOps(
        ops: ConcreteOperation[]
    ): Partial<Record<ConcreteOperation, Record<string, FactRecord>>> {
        const result: Partial<
            Record<ConcreteOperation, Record<string, FactRecord>>
        > = {};
        for (const op of ops) result[op] = this.getRecords(op);
        return result;
    }

    static getRecordsForAllOps(): Partial<
        Record<ConcreteOperation, Record<string, FactRecord>>
    > {
        return this.getRecordsForOps(ALL_OPS);
    }

    private static key(op: ConcreteOperation): string {
        return ProfileStore.scoreKey(`weak-facts:${op}`);
    }
}
