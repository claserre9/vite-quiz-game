import { createStore } from './Store';

export interface AppState {
    authToken: string | null;
    userRole: string | null;
}

export const appStore = createStore<AppState>(
    { authToken: null, userRole: null },
    { storage: 'localStorage', storageKey: 'app_state' }
);

export const isAuthenticated = appStore.computed(
    (state) => state.authToken !== null && state.authToken !== ''
);

export const setAuth = (token: string | null, role: string | null): void => {
    appStore.setState({ authToken: token, userRole: role });
};
