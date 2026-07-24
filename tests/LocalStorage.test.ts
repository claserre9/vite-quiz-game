import { beforeEach, describe, expect, it } from 'vitest';
import {
    readJson,
    readString,
    removeItem,
    writeJson,
    writeString,
} from '@store/LocalStorage.ts';

describe('LocalStorage helper', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('round-trips a plain string', () => {
        expect(readString('missing')).toBeNull();
        writeString('key', 'hello');
        expect(readString('key')).toBe('hello');
    });

    it('round-trips JSON-serializable values', () => {
        expect(readJson('missing')).toBeNull();
        writeJson('key', { a: 1, b: ['x', 'y'] });
        expect(readJson('key')).toEqual({ a: 1, b: ['x', 'y'] });
    });

    it('returns null instead of throwing on malformed JSON', () => {
        window.localStorage.setItem('bad', '{not valid json');
        expect(readJson('bad')).toBeNull();
    });

    it('removeItem deletes the key', () => {
        writeString('key', 'value');
        removeItem('key');
        expect(readString('key')).toBeNull();
    });

    it('writeJson stores a value readable via readString as raw JSON text', () => {
        writeJson('key', [1, 2, 3]);
        expect(readString('key')).toBe('[1,2,3]');
    });
});
