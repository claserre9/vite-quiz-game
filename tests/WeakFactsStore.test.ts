import { beforeEach, describe, expect, it } from 'vitest';
import { WeakFactsStore } from '@store/WeakFactsStore.ts';

describe('WeakFactsStore', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('has no records for an untouched fact', () => {
        expect(WeakFactsStore.getRecords('multiplication')).toEqual({});
    });

    it('accumulates wrong/correct counts for the same fact across calls', () => {
        WeakFactsStore.recordResult('multiplication', '7:8', false);
        WeakFactsStore.recordResult('multiplication', '7:8', false);
        WeakFactsStore.recordResult('multiplication', '7:8', true);

        const record = WeakFactsStore.getRecords('multiplication')['7:8'];
        expect(record.wrong).toBe(2);
        expect(record.correct).toBe(1);
        expect(record.lastSeen).toBeGreaterThan(0);
    });

    it('tracks facts independently per operation and per fact key', () => {
        WeakFactsStore.recordResult('multiplication', '7:8', false);
        WeakFactsStore.recordResult('addition', '7:8', true);
        WeakFactsStore.recordResult('multiplication', '2:3', true);

        expect(WeakFactsStore.getRecords('multiplication')).toEqual({
            '7:8': { wrong: 1, correct: 0, lastSeen: expect.any(Number) },
            '2:3': { wrong: 0, correct: 1, lastSeen: expect.any(Number) },
        });
        expect(WeakFactsStore.getRecords('addition')).toEqual({
            '7:8': { wrong: 0, correct: 1, lastSeen: expect.any(Number) },
        });
    });

    it('getRecordsForOps only returns the requested operations', () => {
        WeakFactsStore.recordResult('multiplication', '7:8', false);
        WeakFactsStore.recordResult('division', '10:2', true);

        const result = WeakFactsStore.getRecordsForOps(['multiplication']);
        expect(result.multiplication).toBeDefined();
        expect(result.division).toBeUndefined();
    });

    it('getRecordsForAllOps covers every concrete operation', () => {
        WeakFactsStore.recordResult('soustraction', '5:2', false);

        const result = WeakFactsStore.getRecordsForAllOps();
        expect(Object.keys(result).sort()).toEqual(
            ['addition', 'division', 'multiplication', 'soustraction'].sort()
        );
        expect(result.soustraction).toEqual({
            '5:2': { wrong: 1, correct: 0, lastSeen: expect.any(Number) },
        });
    });

    it('scopes storage to the active profile, so switching profiles hides prior records', () => {
        WeakFactsStore.recordResult('multiplication', '7:8', false);
        expect(
            WeakFactsStore.getRecords('multiplication')['7:8']
        ).toBeDefined();

        window.localStorage.setItem('qm-active-profile', 'someone-else');
        expect(WeakFactsStore.getRecords('multiplication')).toEqual({});
    });
});
