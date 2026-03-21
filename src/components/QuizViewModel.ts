import { BaseViewModel } from '../core/BaseViewModel';
import { observable, observableArray, pureComputed } from 'knockout';
import incorrectSoundObject from '../medias/sounds/incorrect.mp3';
import correctSoundObject from '../medias/sounds/correct.mp3';

type Operation = 'addition' | 'soustraction' | 'multiplication' | 'general';
type ExerciseType =
    | 'classic'
    | 'missing-number'
    | 'true-false'
    | 'comparison'
    | 'chrono'
    | 'sequence';

interface Answer {
    answer: string;
    correct: boolean;
}

interface Question {
    question: string;
    answers: Answer[];
    selectedAnswer: KnockoutObservable<Answer | null>;
}

const OPERATIONS: readonly Operation[] = [
    'addition',
    'soustraction',
    'multiplication',
    'general',
] as const;

const EXERCISES: readonly ExerciseType[] = [
    'classic',
    'missing-number',
    'true-false',
    'comparison',
    'chrono',
    'sequence',
] as const;

const EXERCISE_LABELS: Record<ExerciseType, string> = {
    classic: 'Quiz classique',
    'missing-number': 'Nombre manquant',
    'true-false': 'Vrai ou faux',
    comparison: 'Comparaison rapide',
    chrono: 'Défi chrono',
    sequence: 'Suites logiques',
};

export class QuizViewModel extends BaseViewModel {
    public static TIME_LEFT = 15;
    public static NUMBER_OF_QUESTIONS = 20;
    public static CHRONO_TOTAL_TIME = 60;
    public static CHRONO_BATCH_SIZE = 25;

    public isLoading = observable(true);
    public errorMessage = observable(null as string | null);
    public questions = observableArray<Question>([]);
    public currentIndex = observable(0);
    public score = observable(0);
    public answerChosen = observable(false);
    public quizFinished = observable(false);
    public isTraining = observable(false);
    public table = observable<number | null>(null);
    public timeLeft = observable(QuizViewModel.TIME_LEFT);
    public exerciseType = observable<ExerciseType>('classic');
    public currentOperation = observable<Operation>('addition');
    public totalAnswered = observable(0);
    public gameModeLabel = observable('Chrono');
    public headline = observable('Quiz classique');

    private timerId: number | null = null;
    private correctSoundObject: HTMLAudioElement;
    private incorrectSoundObject: HTMLAudioElement;

    public scoreEvaluation = pureComputed(() => {
        const s = this.score();
        if (this.exerciseType() === 'chrono') {
            if (s >= 35) return '🚀 Incroyable rythme !';
            if (s >= 25) return '⚡ Super cadence !';
            if (s >= 15) return '👏 Très bon enchaînement !';
            return '💪 Continue, tu prends le rythme !';
        }

        if (s >= 18) return '🏆 Parfait ! Tu es un champion !';
        if (s >= 16) return '🌟 Excellent travail !';
        if (s >= 14) return '😅 Pas terrible, mais ça peut aller...';
        if (s >= 12) return '🤦 Mouais, tu peux mieux faire quand même';
        if (s >= 10) return "😬 C'est la moyenne, un peu faible non ?";
        if (s >= 8) return "🙈 Aïe aïe aïe, c'est pas glorieux...";
        return '💩 Catastrophique ! Retourne réviser !';
    });

    public currentQuestion = pureComputed(() => {
        const index = this.currentIndex();
        const questions = this.questions();
        return questions && questions.length > index ? questions[index] : null;
    });

    public totalQuestions = pureComputed(() => this.questions().length);
    public remainingQuestions = pureComputed(() => {
        if (this.exerciseType() === 'chrono') return '∞';
        return String(Math.max(this.totalQuestions() - this.currentIndex(), 0));
    });

    constructor(context: PageJS.Context | undefined) {
        super(context);

        const params = new URLSearchParams(context?.querystring || '');
        const mode = params.get('mode');
        const tableParam = params.get('table');
        const exerciseParam = params.get('exercise');

        this.isTraining(mode === 'training');
        this.table(
            tableParam !== null && tableParam !== '' ? Number(tableParam) : null
        );
        this.exerciseType(this.parseExercise(exerciseParam));

        this.correctSoundObject = new Audio(correctSoundObject);
        this.incorrectSoundObject = new Audio(incorrectSoundObject);
        this.correctSoundObject.preload = 'auto';
        this.incorrectSoundObject.preload = 'auto';

        this.setTemplate(this.getTemplate());

        this.currentIndex.subscribe(() => {
            if (this.quizFinished()) return;

            if (this.exerciseType() === 'chrono') {
                this.ensureChronoQuestionBuffer();
                return;
            }

            if (!this.isTraining()) {
                this.startPerQuestionTimer();
            }
        });

        void this.loadQuestions();
    }

    private getTemplate(): string {
        const basePath = '/';
        return `
        <div class="container qm-quiz-page">
            <div data-bind="visible: isLoading()" class="qm-empty-card text-center">
                <p class="mb-0">🧠 Chargement en cours... Prépare-toi pour un super quiz !</p>
            </div>

            <div data-bind="visible: errorMessage()" class="qm-empty-card text-center">
                <h2 class="qm-title-font">Oups, petit contretemps</h2>
                <p data-bind="text: errorMessage"></p>
                <button data-bind="click: loadQuestions" class="btn qm-btn mt-2 px-4 py-3">🔁 Réessayer</button>
            </div>

            <div data-bind="if: !isLoading() && !errorMessage()">
                <div class="mx-auto" style="max-width: 860px;">
                    <div class="d-flex justify-content-start mb-3">
                        <a href="${basePath}" class="btn qm-btn-home">🏠 Accueil</a>
                    </div>
                    <div class="qm-quiz-card">
                        <div data-bind="if: !quizFinished() && currentQuestion()">
                            <div class="qm-quiz-header">
                                <div class="qm-chip-row">
                                  <span class="qm-chip">🧩 <span data-bind="text: headline"></span></span>
                                  <span class="qm-chip" data-bind="visible: !isTraining() && exerciseType() !== 'chrono'">🎯 Question <span data-bind="text: currentIndex() + 1"></span>/<span data-bind="text: totalQuestions"></span></span>
                                  <span class="qm-chip" data-bind="visible: isTraining">🔥 Mode Entraînement</span>
                                  <span class="qm-chip">⭐ Score <span data-bind="text: score"></span></span>
                                </div>
                                <div class="qm-chip" data-bind="visible: !isTraining()">⏰ <span data-bind="text: timeLeft"></span>s</div>
                            </div>

                            <div class="qm-progress-wrap" data-bind="visible: !isTraining() && exerciseType() !== 'chrono'">
                                <div class="progress">
                                    <div class="progress-bar" role="progressbar" data-bind="style: { width: ((currentIndex()+1)/totalQuestions()*100 + '%') }"></div>
                                </div>
                            </div>

                            <div class="qm-question-card">
                                <h2 class="qm-question-text text-center" data-bind="text: currentQuestion().question"></h2>
                                <div class="qm-answer-grid" data-bind="foreach: currentQuestion().answers">
                                    <button class="btn qm-answer-btn" data-bind="text: answer, click: $root.selectAnswer, css: $parent.getAnswerClasses($parent.currentQuestion(), $data), disable: $parent.answerChosen() || $parent.quizFinished()"></button>
                                </div>
                            </div>

                            <div class="qm-scoreboard">
                                <div class="qm-score-item">
                                    <span class="qm-score-label">Score</span>
                                    <span class="qm-score-value" data-bind="text: score"></span>
                                </div>
                                <div class="qm-score-item">
                                    <span class="qm-score-label">Restantes</span>
                                    <span class="qm-score-value" data-bind="text: remainingQuestions"></span>
                                </div>
                                <div class="qm-score-item">
                                    <span class="qm-score-label">Mode</span>
                                    <span class="qm-score-value" data-bind="text: gameModeLabel"></span>
                                </div>
                            </div>
                        </div>

                        <div data-bind="if: quizFinished()" class="qm-finish">
                            <span class="qm-finish-badge">🏁 Partie terminée</span>
                            <h2 class="qm-title-font mt-3">Bravo, tu as terminé !</h2>
                            <h3 class="qm-muted" data-bind="text: scoreEvaluation"></h3>
                            <h4 data-bind="visible: exerciseType() !== 'chrono'">🌈 Ton score final : <strong data-bind="text: score"></strong>/<span data-bind="text: totalQuestions"></span></h4>
                            <h4 data-bind="visible: exerciseType() === 'chrono'">🌈 Bonnes réponses : <strong data-bind="text: score"></strong> sur <span data-bind="text: totalAnswered"></span> tentatives</h4>
                            <button data-bind="click: restart" class="btn qm-btn mt-3 px-4 py-3">🔄 Recommencer</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    shuffleArray<T>(array: T[]) {
        const newArray = array.slice();
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    selectAnswer = async (answer: Answer) => {
        if (this.answerChosen() || !this.currentQuestion()) return;

        this.answerChosen(true);
        this.currentQuestion()?.selectedAnswer(answer);
        this.totalAnswered(this.totalAnswered() + 1);

        if (answer.correct) {
            void this.correctSoundObject.play();
            this.score(this.score() + 1);
        } else {
            void this.incorrectSoundObject.play();
        }

        if (this.exerciseType() !== 'chrono' && this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }

        const waitMs = this.exerciseType() === 'chrono' ? 350 : 800;
        setTimeout(() => {
            this.moveToNextQuestion();
        }, waitMs);
    };

    async restart() {
        this.stopTimer();
        this.currentIndex(0);
        this.score(0);
        this.totalAnswered(0);
        this.quizFinished(false);
        this.answerChosen(false);
        await this.loadQuestions(this.context?.params?.operation);
    }

    async loadQuestions(operation?: string): Promise<void> {
        try {
            const op = this.parseOperation(
                operation ?? this.context?.params?.operation
            );
            const exercise = this.exerciseType();

            this.isLoading(true);
            this.errorMessage(null);
            this.stopTimer();
            this.currentIndex(0);
            this.quizFinished(false);
            this.answerChosen(false);
            this.currentOperation(op);
            this.headline(
                op === 'general'
                    ? EXERCISE_LABELS[exercise]
                    : `${EXERCISE_LABELS[exercise]} - ${this.getOperationLabel(op)}`
            );
            this.gameModeLabel(this.resolveGameModeLabel(exercise));
            this.totalAnswered(0);
            this.questions([]);

            if (this.isTraining()) {
                const generated = this.generateClassicTrainingQuestions(
                    op,
                    this.table()
                );
                this.questions(
                    generated.slice(0, QuizViewModel.NUMBER_OF_QUESTIONS)
                );
                this.headline(
                    `${EXERCISE_LABELS.classic} - ${this.getOperationLabel(op)}`
                );
                this.gameModeLabel('Libre');
                return;
            }

            if (exercise === 'classic') {
                this.questions(await this.loadClassicQuestions(op));
            } else {
                this.questions(this.generateDynamicQuestions(op, exercise));
            }

            if (exercise === 'chrono') {
                this.timeLeft(QuizViewModel.CHRONO_TOTAL_TIME);
                this.startChronoTimer();
            } else if (!this.isTraining()) {
                this.timeLeft(QuizViewModel.TIME_LEFT);
                this.startPerQuestionTimer();
            }
        } catch (error) {
            console.error('Error loading questions:', error);
            this.errorMessage(
                "Oups ! Une erreur s'est produite en chargeant les questions."
            );
        } finally {
            this.isLoading(false);
        }
    }

    getAnswerClasses(question: Question | null, answer: Answer) {
        if (!question || !question.selectedAnswer()) return null;
        return {
            'btn-success': answer.correct,
            'btn-danger':
                !answer.correct && answer === question.selectedAnswer(),
        };
    }

    private parseOperation(operation?: string): Operation {
        const value = String(operation || 'addition')
            .replace(/^\/+/, '')
            .toLowerCase();
        return (OPERATIONS as readonly string[]).includes(value)
            ? (value as Operation)
            : 'addition';
    }

    private parseExercise(exercise?: string | null): ExerciseType {
        const value = String(exercise || 'classic').toLowerCase();
        return (EXERCISES as readonly string[]).includes(value)
            ? (value as ExerciseType)
            : 'classic';
    }

    private resolveGameModeLabel(exercise: ExerciseType): string {
        if (exercise === 'chrono') return '60s';
        if (this.isTraining()) return 'Libre';
        return 'Chrono';
    }

    private async loadClassicQuestions(op: Operation): Promise<Question[]> {
        const fallback = 'addition' as const;
        const safeOp = op === 'general' ? fallback : op;
        const loaders = {
            addition: () => import('../json/addition.json'),
            soustraction: () => import('../json/soustraction.json'),
            multiplication: () => import('../json/multiplication.json'),
        };

        const questions = (await loaders[safeOp]()).default;
        const shuffledQuestions = this.shuffleArray(questions);
        return shuffledQuestions
            .map((q) => ({
                ...q,
                answers: this.shuffleArray(q.answers as Answer[]),
                selectedAnswer: observable<Answer | null>(null),
            }))
            .slice(0, QuizViewModel.NUMBER_OF_QUESTIONS) as Question[];
    }

    private startPerQuestionTimer() {
        this.stopTimer();
        this.timeLeft(QuizViewModel.TIME_LEFT);
        this.timerId = window.setInterval(() => {
            this.timeLeft(this.timeLeft() - 1);
            if (this.timeLeft() <= 0) {
                this.stopTimer();
                this.totalAnswered(this.totalAnswered() + 1);
                this.moveToNextQuestion();
            }
        }, 1000);
    }

    private startChronoTimer() {
        this.stopTimer();
        this.timerId = window.setInterval(() => {
            this.timeLeft(this.timeLeft() - 1);
            if (this.timeLeft() <= 0) {
                this.stopTimer();
                this.quizFinished(true);
            }
        }, 1000);
    }

    private stopTimer() {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    private moveToNextQuestion() {
        this.answerChosen(false);

        if (this.exerciseType() === 'chrono') {
            if (this.timeLeft() <= 0) {
                this.quizFinished(true);
                return;
            }
            const nextIndex = this.currentIndex() + 1;
            this.currentIndex(nextIndex);
            this.ensureChronoQuestionBuffer();
            return;
        }

        const nextIndex = this.currentIndex() + 1;
        if (nextIndex < this.totalQuestions()) {
            this.currentIndex(nextIndex);
        } else {
            this.quizFinished(true);
            this.stopTimer();
        }
    }

    private ensureChronoQuestionBuffer() {
        const remaining = this.totalQuestions() - this.currentIndex();
        if (remaining > 10) return;

        const extraQuestions = this.generateDynamicQuestions(
            this.currentOperation(),
            'chrono',
            QuizViewModel.CHRONO_BATCH_SIZE
        );
        this.questions([...this.questions(), ...extraQuestions]);
    }

    private generateDynamicQuestions(
        op: Operation,
        exercise: ExerciseType,
        count = QuizViewModel.NUMBER_OF_QUESTIONS
    ): Question[] {
        switch (exercise) {
            case 'missing-number':
                return this.generateMissingNumberQuestions(op, count);
            case 'true-false':
                return this.generateTrueFalseQuestions(op, count);
            case 'comparison':
                return this.generateComparisonQuestions(count);
            case 'chrono':
                return this.generateChronoQuestions(op, count);
            case 'sequence':
                return this.generateSequenceQuestions(count);
            default:
                return this.generateClassicTrainingQuestions(op, null).slice(
                    0,
                    count
                );
        }
    }

    private generateClassicTrainingQuestions(
        op: Operation,
        table: number | null
    ): Question[] {
        const safeOp = op === 'general' ? 'addition' : op;
        const makeQuestion = (
            question: string,
            correctAnswer: number
        ): Question => {
            const distractors = this.buildDistractors(correctAnswer);
            return {
                question,
                answers: this.shuffleArray([
                    { answer: `🎈 ${correctAnswer}`, correct: true },
                    ...distractors.map((n) => ({
                        answer: `🎈 ${n}`,
                        correct: false,
                    })),
                ]),
                selectedAnswer: observable<Answer | null>(null),
            };
        };

        const qs: Question[] = [];
        const t = table ?? this.randomInt(2, 12);

        if (safeOp === 'multiplication') {
            for (let n = 0; n <= 12; n++)
                qs.push(makeQuestion(`${t} × ${n} = ?`, t * n));
        } else if (safeOp === 'addition') {
            for (let n = 0; n <= 20; n++)
                qs.push(makeQuestion(`${t} + ${n} = ?`, t + n));
        } else {
            for (let n = 0; n <= 20; n++) {
                const a = t + n;
                qs.push(makeQuestion(`${a} − ${t} = ?`, a - t));
            }
        }

        return this.shuffleArray(qs);
    }

    private generateMissingNumberQuestions(
        op: Operation,
        count: number
    ): Question[] {
        const safeOp = op === 'general' ? 'addition' : op;
        const questions: Question[] = [];

        for (let i = 0; i < count; i++) {
            const a = this.randomInt(1, 12);
            const b = this.randomInt(1, 12);

            if (safeOp === 'addition') {
                const total = a + b;
                const missingFirst = Math.random() < 0.5;
                const question = missingFirst
                    ? `❓ + ${b} = ${total}`
                    : `${a} + ❓ = ${total}`;
                questions.push(
                    this.makeChoiceQuestion(question, missingFirst ? a : b)
                );
            } else if (safeOp === 'soustraction') {
                const total = a + b;
                const missingFirst = Math.random() < 0.5;
                const question = missingFirst
                    ? `❓ − ${a} = ${b}`
                    : `${total} − ❓ = ${b}`;
                questions.push(
                    this.makeChoiceQuestion(question, missingFirst ? total : a)
                );
            } else {
                const total = a * b;
                const missingFirst = Math.random() < 0.5;
                const question = missingFirst
                    ? `❓ × ${b} = ${total}`
                    : `${a} × ❓ = ${total}`;
                questions.push(
                    this.makeChoiceQuestion(question, missingFirst ? a : b)
                );
            }
        }

        return questions;
    }

    private generateTrueFalseQuestions(
        op: Operation,
        count: number
    ): Question[] {
        const safeOp = op === 'general' ? 'addition' : op;
        const questions: Question[] = [];

        for (let i = 0; i < count; i++) {
            const a = this.randomInt(1, 12);
            const b = this.randomInt(1, 12);
            const correctResult = this.calculate(a, b, safeOp);
            const shouldBeTrue = Math.random() < 0.5;
            const shownResult = shouldBeTrue
                ? correctResult
                : correctResult + this.randomNonZeroDelta(1, 4);

            questions.push({
                question: `${this.renderExpression(a, b, safeOp)} = ${shownResult}`,
                answers: this.shuffleArray([
                    {
                        answer: '✅ Vrai',
                        correct: shownResult === correctResult,
                    },
                    {
                        answer: '❌ Faux',
                        correct: shownResult !== correctResult,
                    },
                ]),
                selectedAnswer: observable<Answer | null>(null),
            });
        }

        return questions;
    }

    private generateComparisonQuestions(count: number): Question[] {
        const questions: Question[] = [];

        for (let i = 0; i < count; i++) {
            const left = this.randomInt(5, 99);
            const right = this.randomInt(5, 99);
            let correct = '⬅️ Gauche';
            if (right > left) correct = '➡️ Droite';
            if (left === right) correct = '🤝 Égal';

            questions.push({
                question: `Quel nombre est le plus grand ? ${left}   vs   ${right}`,
                answers: this.shuffleArray([
                    { answer: '⬅️ Gauche', correct: correct === '⬅️ Gauche' },
                    { answer: '➡️ Droite', correct: correct === '➡️ Droite' },
                    { answer: '🤝 Égal', correct: correct === '🤝 Égal' },
                ]),
                selectedAnswer: observable<Answer | null>(null),
            });
        }

        return questions;
    }

    private generateChronoQuestions(op: Operation, count: number): Question[] {
        const questions: Question[] = [];
        for (let i = 0; i < count; i++) {
            const currentOp: Exclude<Operation, 'general'> =
                op === 'general' ? this.randomOperation() : op;
            const a = this.randomInt(1, 12);
            const b =
                currentOp === 'soustraction'
                    ? this.randomInt(1, a)
                    : this.randomInt(1, 12);
            questions.push(
                this.makeChoiceQuestion(
                    this.renderOperation(a, b, currentOp),
                    this.calculate(a, b, currentOp)
                )
            );
        }
        return questions;
    }

    private generateSequenceQuestions(count: number): Question[] {
        const questions: Question[] = [];

        for (let i = 0; i < count; i++) {
            const kind = this.randomInt(0, 2);
            const start = this.randomInt(1, 15);
            const step = this.randomInt(2, 6);

            if (kind === 0) {
                const seq = [
                    start,
                    start + step,
                    start + step * 2,
                    start + step * 3,
                ];
                questions.push(
                    this.makeChoiceQuestion(
                        `Complète la suite : ${seq[0]}, ${seq[1]}, ${seq[2]}, ?`,
                        seq[3]
                    )
                );
            } else if (kind === 1) {
                const ratio = this.randomInt(2, 4);
                const seq = [
                    start,
                    start * ratio,
                    start * ratio * ratio,
                    start * ratio * ratio * ratio,
                ];
                questions.push(
                    this.makeChoiceQuestion(
                        `Complète la suite : ${seq[0]}, ${seq[1]}, ${seq[2]}, ?`,
                        seq[3]
                    )
                );
            } else {
                const seq = [start, start + 2, start + 5, start + 9];
                questions.push(
                    this.makeChoiceQuestion(
                        `Trouve le prochain nombre : ${seq[0]}, ${seq[1]}, ${seq[2]}, ${seq[3]}, ?`,
                        start + 14
                    )
                );
            }
        }

        return questions;
    }

    private makeChoiceQuestion(
        question: string,
        correctAnswer: number
    ): Question {
        const distractors = this.buildDistractors(correctAnswer);
        return {
            question,
            answers: this.shuffleArray([
                { answer: `🎈 ${correctAnswer}`, correct: true },
                ...distractors.map((n) => ({
                    answer: `🎈 ${n}`,
                    correct: false,
                })),
            ]),
            selectedAnswer: observable<Answer | null>(null),
        };
    }

    private buildDistractors(correct: number): number[] {
        const set = new Set<number>();
        const range = Math.max(2, Math.floor(Math.abs(correct) * 0.25) + 2);
        while (set.size < 3) {
            const delta = Math.floor(Math.random() * range) + 1;
            const sign = Math.random() < 0.5 ? -1 : 1;
            const candidate = correct + sign * delta;
            if (
                candidate !== correct &&
                candidate >= -100 &&
                candidate <= 1000
            ) {
                set.add(candidate);
            }
        }
        return Array.from(set);
    }

    private calculate(
        a: number,
        b: number,
        op: Exclude<Operation, 'general'>
    ): number {
        if (op === 'addition') return a + b;
        if (op === 'soustraction') return a - b;
        return a * b;
    }

    private renderOperation(
        a: number,
        b: number,
        op: Exclude<Operation, 'general'>
    ): string {
        return `${this.renderExpression(a, b, op)} = ?`;
    }

    private renderExpression(
        a: number,
        b: number,
        op: Exclude<Operation, 'general'>
    ): string {
        if (op === 'addition') return `${a} + ${b}`;
        if (op === 'soustraction') return `${a} − ${b}`;
        return `${a} × ${b}`;
    }

    private getOperationLabel(op: Operation): string {
        if (op === 'soustraction') return 'Soustraction';
        if (op === 'multiplication') return 'Multiplication';
        if (op === 'general') return 'Mix';
        return 'Addition';
    }

    private randomOperation(): Exclude<Operation, 'general'> {
        const values: Exclude<Operation, 'general'>[] = [
            'addition',
            'soustraction',
            'multiplication',
        ];
        return values[this.randomInt(0, values.length - 1)];
    }

    private randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private randomNonZeroDelta(min: number, max: number): number {
        const delta = this.randomInt(min, max);
        return Math.random() < 0.5 ? -delta : delta;
    }
}
