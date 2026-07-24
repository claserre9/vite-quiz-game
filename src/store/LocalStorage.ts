/**
 * Thin, consistent wrapper around `localStorage` used by every store in the app
 * (ProfileStore, WeakFactsStore, QuizScoreStore). Centralizes the "is storage
 * available" guard and JSON parse/stringify error handling so each store doesn't
 * repeat its own variant of the same try/catch boilerplate.
 */

function isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
}

export function readString(key: string): string | null {
    if (!isAvailable()) return null;
    return window.localStorage.getItem(key);
}

export function writeString(key: string, value: string): void {
    if (!isAvailable()) return;
    window.localStorage.setItem(key, value);
}

export function removeItem(key: string): void {
    if (!isAvailable()) return;
    window.localStorage.removeItem(key);
}

export function readJson<T>(key: string): T | null {
    const raw = readString(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export function writeJson(key: string, value: unknown): void {
    writeString(key, JSON.stringify(value));
}
