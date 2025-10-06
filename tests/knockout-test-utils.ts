import { BaseViewModel, renderView } from '../src/core/BaseViewModel';

export function renderViewModel<T extends BaseViewModel>(
    ViewModel: new (context?: PageJS.Context) => T,
    selector = 'app'
) {
    const viewModel = renderView(ViewModel, undefined, selector) as T;
    const container = document.getElementById(selector)!;
    return { viewModel, container };
}

export function cleanup(selector = 'app') {
    const el = document.getElementById(selector);
    if (el) {
        el.remove();
    }
}
