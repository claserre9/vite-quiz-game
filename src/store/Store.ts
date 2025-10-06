import * as ko from 'knockout';

export type StorageType = 'localStorage' | 'sessionStorage';

export interface StoreOptions {
    storage?: StorageType;
    storageKey?: string;
}

export class Store<T> {
    private state: KnockoutObservable<T>;
    private storage?: StorageType;
    private storageKey: string;

    constructor(initialState: T, options: StoreOptions = {}) {
        this.storage = options.storage;
        this.storageKey = options.storageKey || 'app_state';
        const persisted = this.load();
        this.state = ko.observable({ ...initialState, ...persisted });
        this.state.subscribe(() => this.save());
    }

    public getState(): T {
        return this.state();
    }

    public setState(partial: Partial<T>): void {
        this.state({ ...this.state(), ...partial });
    }

    public computed<U>(fn: (state: T) => U): KnockoutComputed<U> {
        return ko.pureComputed(() => fn(this.state()));
    }

    public subscribe(callback: (state: T) => void): KnockoutSubscription {
        return this.state.subscribe(callback);
    }

    private save(): void {
        if (!this.storage) return;
        try {
            const storage = window[this.storage];
            storage.setItem(this.storageKey, JSON.stringify(this.state()));
        } catch (err) {
            console.error('Failed to persist state', err);
        }
    }

    private load(): Partial<T> {
        if (!this.storage) return {};
        try {
            const storage = window[this.storage];
            const data = storage.getItem(this.storageKey);
            return data ? (JSON.parse(data) as T) : {};
        } catch (err) {
            console.error('Failed to load persisted state', err);
            return {};
        }
    }
}

export const createStore = <T>(
    initialState: T,
    options?: StoreOptions
): Store<T> => new Store(initialState, options);
