import type { Operation, Question, QuestionVisual } from './QuestionGenerator';

/** Renders a QuestionVisual description into the markup QuizViewModel injects via the `html` binding. */
export function renderQuestionVisual(visual: QuestionVisual): string {
    switch (visual.type) {
        case 'fraction-bar':
            return renderFractionBar(visual);
        case 'number-line':
            return renderNumberLine(visual);
        case 'array':
            return renderArray(visual);
        case 'groups':
            return renderGroups(visual);
    }
}

function renderFractionBar(v: { total: number; filled: number }): string {
    const segments = Array.from({ length: v.total }, (_, i) => {
        const filledClass = i < v.filled ? ' qm-fraction-segment--filled' : '';
        return `<div class="qm-fraction-segment${filledClass}"></div>`;
    }).join('');
    return `<div class="qm-fraction-bar">${segments}</div>`;
}

function renderNumberLine(v: {
    min: number;
    max: number;
    step: number;
    point: number;
}): string {
    const width = 600;
    const height = 90;
    const padding = 30;
    const innerWidth = width - padding * 2;
    const toX = (value: number) =>
        padding + ((value - v.min) / (v.max - v.min)) * innerWidth;

    const tickCount = (v.max - v.min) / v.step;
    const ticks: string[] = [];
    for (let i = 0; i <= tickCount; i++) {
        const value = v.min + i * v.step;
        const x = toX(value);
        ticks.push(
            `<line class="qm-numberline-tick" x1="${x}" y1="30" x2="${x}" y2="42" stroke-width="2" />`,
            `<text class="qm-numberline-label" x="${x}" y="60" font-size="13" text-anchor="middle">${value}</text>`
        );
    }

    const pointX = toX(v.point);

    return `
        <svg viewBox="0 0 ${width} ${height}" class="qm-number-line" role="img" aria-label="Droite numérique">
            <line class="qm-numberline-axis" x1="${padding}" y1="36" x2="${width - padding}" y2="36" stroke-width="3" stroke-linecap="round" />
            ${ticks.join('')}
            <circle class="qm-numberline-point" cx="${pointX}" cy="36" r="8" stroke-width="2" />
        </svg>
    `;
}

function renderArray(v: { rows: number; cols: number }): string {
    const dots = Array.from(
        { length: v.rows * v.cols },
        () => '<span class="qm-array-dot"></span>'
    ).join('');
    return `<div class="qm-array-grid" style="grid-template-columns: repeat(${v.cols}, 1fr); max-width: ${v.cols * 34}px;">${dots}</div>`;
}

function renderGroups(v: { total: number; groups: number }): string {
    const dots = Array.from(
        { length: v.total },
        () => '<span class="qm-array-dot"></span>'
    ).join('');
    return `<div class="qm-groups-cluster">${dots}</div>`;
}

export interface TableGridCell {
    label: string;
    result: number;
    answered: boolean;
    isCurrent: boolean;
    wasCorrect: boolean;
}

/** Computes the cells for the table-gaps grid visualization (the full table 1..maxFactor, with progress). */
export function computeTableGridCells(params: {
    table: number;
    op: Operation;
    maxFactor: number;
    currentIndex: number;
    quizFinished: boolean;
    questions: Question[];
}): TableGridCell[] {
    const {
        table: t,
        op,
        maxFactor,
        currentIndex,
        quizFinished,
        questions,
    } = params;
    const symbol =
        op === 'multiplication'
            ? '×'
            : op === 'addition'
              ? '+'
              : op === 'division'
                ? '÷'
                : '−';

    return Array.from({ length: maxFactor }, (_, i) => {
        const n = i + 1;
        const result =
            op === 'multiplication'
                ? t * n
                : op === 'division'
                  ? n
                  : op === 'soustraction'
                    ? n
                    : t + n;
        const label =
            op === 'soustraction'
                ? `${t + n}${symbol}${t}`
                : op === 'division'
                  ? `${t * n}${symbol}${t}`
                  : `${t}${symbol}${n}`;
        const answered = i < currentIndex;
        const isCurrent = i === currentIndex && !quizFinished;
        const q = questions[i];
        const wasCorrect = answered && q?.selectedAnswer()?.correct === true;
        return { label, result, answered, isCurrent, wasCorrect };
    });
}
