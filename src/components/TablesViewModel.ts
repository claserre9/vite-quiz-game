import { BaseViewModel } from '@core/BaseViewModel';
import { url } from '@core/url';
import { observable, observableArray, pureComputed } from 'knockout';
import { ProfileStore } from '@store/ProfileStore';

type TableOp = 'addition' | 'soustraction' | 'multiplication' | 'division';

const OP_SYMBOLS: Record<TableOp, string> = {
    addition: '+',
    soustraction: '−',
    multiplication: '×',
    division: '÷',
};

const OP_SECTION_TITLES: Record<TableOp, string> = {
    addition: "Tables d'addition",
    soustraction: 'Tables de soustraction',
    multiplication: 'Tables de multiplication',
    division: 'Tables de division',
};

export class TablesViewModel extends BaseViewModel {
    op = observable<TableOp>('addition');
    multiSelectMode = observable(false);
    selectedTables = observableArray<number>([]);

    hasSelection = pureComputed(() => this.selectedTables().length > 0);

    sectionTitle = pureComputed(() => OP_SECTION_TITLES[this.op()]);

    constructor(context: PageJS.Context | undefined) {
        super(context);
        // Clear selection when switching operation
        this.registerSubscription(
            this.op.subscribe(() => this.selectedTables([]))
        );
        this.setTemplate(this.getTemplate());
    }

    opSymbol(op: TableOp): string {
        return OP_SYMBOLS[op];
    }

    getBestScoreLabel(op: TableOp, t: number): string {
        if (typeof window === 'undefined' || !window.localStorage)
            return 'Pas encore joué';
        const key = ProfileStore.scoreKey(
            `quiz-math-best:classic:${op}:training:t${t}`
        );
        const raw = window.localStorage.getItem(key);
        if (!raw) return 'Pas encore joué';
        const label = raw.includes('/') ? raw : `${raw}/20`;
        return `Record : ${label}`;
    }

    onCardClick = (t: number) => {
        if (this.multiSelectMode()) {
            const idx = this.selectedTables.indexOf(t);
            if (idx >= 0) this.selectedTables.splice(idx, 1);
            else this.selectedTables.push(t);
        } else {
            this.navigateSingle(t);
        }
    };

    toggleMultiSelect = () => {
        if (this.multiSelectMode()) {
            this.multiSelectMode(false);
            this.selectedTables([]);
        } else {
            this.multiSelectMode(true);
        }
    };

    selectAll = () => {
        this.selectedTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    };

    startMulti = () => {
        const tables = this.selectedTables();
        if (tables.length === 0) return;
        const op = this.op();
        const sorted = tables.slice().sort((a, b) => a - b);
        const qs = new URLSearchParams({
            mode: 'training',
            tables: sorted.join(','),
            exercise: 'classic',
            maxFactor: '10',
        });
        const path = `/quiz/${op}?${qs.toString()}`;
        if (window.page && typeof window.page.show === 'function') {
            window.page.show(path);
        } else {
            window.location.href = url(`/quiz/${op}?${qs.toString()}`);
        }
    };

    private navigateSingle(t: number) {
        const op = this.op();
        const qs = new URLSearchParams({
            mode: 'training',
            table: String(t),
            exercise: 'classic',
            maxFactor: '10',
        });
        const path = `/quiz/${op}?${qs.toString()}`;
        if (window.page && typeof window.page.show === 'function') {
            window.page.show(path);
        } else {
            window.location.href = url(`/quiz/${op}?${qs.toString()}`);
        }
    }

    private getTemplate(): string {
        return `
        <div class="container qm-tables-page" style="max-width: 900px;">
            <a href="${url('/')}" class="btn qm-btn-home mb-3">🏠 Accueil</a>

            <div class="qm-panel">
                <div class="text-center mb-4">
                    <span class="qm-pill">📚 Tables à apprendre</span>
                    <h1 class="qm-section-title mt-3 mb-2">Tables de 1 à 10</h1>
                    <p class="qm-muted mb-0">Choisis une table ou sélectionnes-en plusieurs pour t'entraîner ensemble.</p>
                </div>

                <!-- Tab bar -->
                <div class="d-flex justify-content-center gap-3 mb-4">
                    <button class="btn qm-btn px-4 py-2"
                            data-bind="click: function(){ op('addition'); }, css: { 'active-tab': op() === 'addition' }">➕ Addition</button>
                    <button class="btn qm-btn-secondary px-4 py-2"
                            data-bind="click: function(){ op('soustraction'); }, css: { 'active-tab': op() === 'soustraction' }">➖ Soustraction</button>
                    <button class="btn qm-btn-secondary px-4 py-2"
                            data-bind="click: function(){ op('multiplication'); }, css: { 'active-tab': op() === 'multiplication' }">✖️ Multiplication</button>
                    <button class="btn qm-btn-secondary px-4 py-2"
                            data-bind="click: function(){ op('division'); }, css: { 'active-tab': op() === 'division' }">➗ Division</button>
                </div>

                <!-- Section title -->
                <h2 class="qm-section-title text-center mb-3" style="font-size:1.1rem;"
                    data-bind="text: sectionTitle"></h2>

                <!-- Multi-select toolbar -->
                <div class="d-flex flex-wrap align-items-center gap-2 mb-3 justify-content-center">
                    <button class="btn btn-sm qm-btn-secondary px-3"
                            data-bind="click: toggleMultiSelect, text: multiSelectMode() ? '✖ Annuler la sélection' : '☑ Sélectionner plusieurs tables'"></button>
                    <button class="btn btn-sm qm-btn-secondary px-3"
                            data-bind="visible: multiSelectMode(), click: selectAll">Tout sélectionner</button>
                    <button class="btn btn-sm qm-btn px-3"
                            data-bind="visible: multiSelectMode() && hasSelection(), click: startMulti">
                        🚀 Commencer avec <span data-bind="text: selectedTables().length"></span> table<span data-bind="visible: selectedTables().length > 1">s</span>
                    </button>
                </div>

                <!-- Table cards grid -->
                <div class="row g-3 justify-content-center" data-bind="foreach: [1,2,3,4,5,6,7,8,9,10]">
                    <div class="col-6 col-sm-4 col-md-3 col-lg-2">
                        <div class="card qm-feature-card qm-table-card position-relative"
                             data-bind="attr: { 'data-tone': $root.op() },
                                        click: function(){ $root.onCardClick($data); },
                                        css: { 'qm-table-card--selected': $root.selectedTables().indexOf($data) >= 0 }">
                            <!-- Checkbox overlay in multi-select mode -->
                            <div class="qm-table-card-check" data-bind="visible: $root.multiSelectMode()">
                                <input type="checkbox" class="form-check-input"
                                       data-bind="checked: $root.selectedTables, checkedValue: $data,
                                                  click: function(d, e){ e.stopPropagation(); return true; }">
                            </div>
                            <div class="card-body d-flex flex-column align-items-center justify-content-center text-center p-3">
                                <div class="qm-table-number" data-bind="text: $data"></div>
                                <div class="qm-muted small mt-1"
                                     data-bind="text: 'Table de ' + $data + ' ' + $root.opSymbol($root.op())"></div>
                                <span class="qm-badge-soft mt-2"
                                      data-bind="text: $root.getBestScoreLabel($root.op(), $data),
                                                 style: { opacity: $root.getBestScoreLabel($root.op(), $data).startsWith('Pas') ? '0.45' : '1' }"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }
}
