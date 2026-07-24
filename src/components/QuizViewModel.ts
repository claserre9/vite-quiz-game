import { BaseViewModel } from '../core/BaseViewModel';
import { url } from '../core/url';
import { observable, observableArray, pureComputed } from 'knockout';
import {
    generateQuestions,
    type Operation,
    type ExerciseType,
    type Answer,
    type Question,
} from '../core/QuestionGenerator';
import {
    OPERATIONS,
    EXERCISES,
    EXERCISE_LABELS,
    FREE_INPUT_EXERCISES,
} from '../core/ExerciseMeta';
import { WeakFactsStore } from '../store/WeakFactsStore';
import { QuizScoreStore } from '../store/QuizScoreStore';
import {
    renderQuestionVisual,
    computeTableGridCells,
} from '../core/QuestionVisuals';
import { QuizTimers } from '../core/QuizTimers';
import { loadClassicQuestionsFromJson } from '../core/ClassicQuestionsLoader';
import { buildQuizTemplate } from './QuizViewModel.template';
import incorrectSoundObject from '../medias/sounds/incorrect.mp3';
import correctSoundObject from '../medias/sounds/correct.mp3';

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
    public tables = observableArray<number>([]);
    public maxFactor = observable<number | null>(null);
    public timeLeft = observable(QuizViewModel.TIME_LEFT);
    public exerciseType = observable<ExerciseType>('classic');
    public currentOperation = observable<Operation>('addition');
    public totalAnswered = observable(0);
    public gameModeLabel = observable('Chrono');
    public headline = observable('Quiz classique');
    public bestScoreLabel = observable('Aucun record');

    // Free-input state
    public userInput = observable('');
    public lastAnswerFeedback = observable('');
    public lastAnswerCorrect = observable(false);

    // Sprint state
    public sprintElapsed = observable(0);
    public bestTimeLabel = observable('');

    public isFreeInput = pureComputed(() =>
        (FREE_INPUT_EXERCISES as readonly string[]).includes(
            this.exerciseType()
        )
    );

    public isUnlimitedTraining = pureComputed(
        () =>
            this.isTraining() &&
            this.exerciseType() !== 'sprint' &&
            this.exerciseType() !== 'table-gaps'
    );

    public shouldFocusInput = pureComputed(
        () =>
            this.isFreeInput() &&
            !this.answerChosen() &&
            !this.quizFinished() &&
            !this.isLoading()
    );

    /** Cells for the table-gaps grid visualization */
    public tableGridCells = pureComputed(() => {
        const t = this.table();
        if (this.exerciseType() !== 'table-gaps' || t === null) return [];
        return computeTableGridCells({
            table: t,
            op: this.currentOperation(),
            maxFactor: this.maxFactor() ?? 10,
            currentIndex: this.currentIndex(),
            quizFinished: this.quizFinished(),
            questions: this.questions(),
        });
    });

    private timers = new QuizTimers();
    private correctSoundObject: HTMLAudioElement;
    private incorrectSoundObject: HTMLAudioElement;
    private scoreSaved = false;

    public scoreEvaluation = pureComputed(() => {
        const s = this.score();
        if (this.exerciseType() === 'chrono') {
            if (s >= 35) return '🚀 Incroyable rythme !';
            if (s >= 25) return '⚡ Super cadence !';
            if (s >= 15) return '👏 Très bon enchaînement !';
            return '💪 Continue, tu prends le rythme !';
        }

        if (this.exerciseType() === 'sprint') {
            const perfect = s === this.totalQuestions();
            const t = this.sprintElapsed();
            if (perfect && t <= 20)
                return "⚡ Fulgurant ! Vitesse de l'éclair !";
            if (perfect && t <= 40) return '🏃 Super rapide ! Excellent !';
            if (perfect) return '🏆 Table parfaite ! Bravo !';
            if (s === this.totalQuestions() - 1)
                return '😅 Presque parfait, encore un effort !';
            return "💪 Continue à t'entraîner !";
        }

        const total = this.totalQuestions();
        const pct = total > 0 ? s / total : 0;
        if (pct >= 0.95) return '🏆 Parfait ! Tu es un champion !';
        if (pct >= 0.8) return '🌟 Excellent travail !';
        if (pct >= 0.65) return '👍 Très bien, continue comme ça !';
        if (pct >= 0.5) return '😅 Pas mal, mais tu peux faire mieux !';
        if (pct >= 0.35) return "😬 C'est la moyenne, encore un effort !";
        return "💪 Continue à t'entraîner, ça va venir !";
    });

    public currentQuestion = pureComputed(() => {
        const index = this.currentIndex();
        const questions = this.questions();
        return questions && questions.length > index ? questions[index] : null;
    });

    public visualMarkup = pureComputed(() => {
        const visual = this.currentQuestion()?.visual;
        return visual ? renderQuestionVisual(visual) : '';
    });

    public totalQuestions = pureComputed(() => this.questions().length);
    public remainingQuestions = pureComputed(() => {
        if (this.exerciseType() === 'chrono' || this.isUnlimitedTraining())
            return '∞';
        return String(Math.max(this.totalQuestions() - this.currentIndex(), 0));
    });

    constructor(context: PageJS.Context | undefined) {
        super(context);

        const params = new URLSearchParams(context?.querystring || '');
        const tableParam = params.get('table');
        const tablesParam = params.get('tables');
        const maxFactorParam = params.get('maxFactor');

        this.isTraining(params.get('mode') === 'training');

        if (tablesParam) {
            const parsed = tablesParam
                .split(',')
                .map(Number)
                .filter((n) => !isNaN(n) && n >= 1);
            this.tables(parsed);
            this.table(parsed[0] ?? null);
        } else if (tableParam !== null && tableParam !== '') {
            const t = Number(tableParam);
            this.table(t);
            this.tables([t]);
        }

        this.maxFactor(
            maxFactorParam !== null && maxFactorParam !== ''
                ? Number(maxFactorParam)
                : null
        );
        this.exerciseType(this.parseExercise(params.get('exercise')));

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
            if (
                !this.isTraining() &&
                !this.isFreeInput() &&
                this.exerciseType() !== 'sprint'
            ) {
                this.startPerQuestionTimer();
            }
        });

        void this.loadQuestions();
    }

    private getTemplate(): string {
        return buildQuizTemplate(url('/'));
    }

    selectAnswer = async (answer: Answer) => {
        if (this.answerChosen() || !this.currentQuestion()) return;

        this.answerChosen(true);
        const question = this.currentQuestion();
        question?.selectedAnswer(answer);
        this.totalAnswered(this.totalAnswered() + 1);

        if (question?.fact) {
            WeakFactsStore.recordResult(
                question.fact.op,
                question.fact.key,
                answer.correct
            );
        }

        if (answer.correct) {
            void this.correctSoundObject.play();
            this.score(this.score() + 1);
        } else {
            void this.incorrectSoundObject.play();
        }

        if (this.exerciseType() !== 'chrono') {
            this.timers.stopCountdown();
        }

        const waitMs =
            this.exerciseType() === 'chrono'
                ? 350
                : this.isFreeInput()
                  ? 600
                  : 800;
        setTimeout(() => this.moveToNextQuestion(), waitMs);
    };

    submitFreeInput = () => {
        const question = this.currentQuestion();
        if (!question || this.answerChosen() || !this.userInput().trim())
            return;

        const input = this.userInput().trim();
        const correct = input === question.correctValue;
        this.lastAnswerCorrect(correct);
        this.lastAnswerFeedback(
            correct
                ? '✓ Correct !'
                : `✗ La bonne réponse était ${question.correctValue}`
        );
        this.userInput('');
        void this.selectAnswer({ answer: input, correct });
    };

    onInputKeyDown = (_data: unknown, event: KeyboardEvent): boolean => {
        if (event.key === 'Enter') {
            this.submitFreeInput();
            return false;
        }
        return true;
    };

    async restart() {
        this.timers.stopAll();
        this.currentIndex(0);
        this.score(0);
        this.totalAnswered(0);
        this.quizFinished(false);
        this.answerChosen(false);
        this.scoreSaved = false;
        this.sprintElapsed(0);
        this.userInput('');
        this.lastAnswerFeedback('');
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
            this.timers.stopAll();
            this.currentIndex(0);
            this.quizFinished(false);
            this.answerChosen(false);
            this.scoreSaved = false;
            this.currentOperation(op);
            this.sprintElapsed(0);
            this.userInput('');
            this.lastAnswerFeedback('');
            this.headline(
                op === 'general'
                    ? EXERCISE_LABELS[exercise]
                    : `${EXERCISE_LABELS[exercise]} - ${this.getOperationLabel(op)}`
            );
            this.gameModeLabel(this.resolveGameModeLabel(exercise));
            this.totalAnswered(0);
            this.questions([]);

            if (exercise === 'sprint') {
                this.bestScoreLabel(
                    this.loadSprintBestTimeLabel(op, this.table())
                );
                this.bestTimeLabel(
                    this.loadSprintBestTimeLabel(op, this.table())
                );
            } else {
                this.bestScoreLabel(
                    this.loadBestScoreLabel(op, exercise, this.isTraining())
                );
                this.bestTimeLabel('');
            }

            const genOptions = {
                count: QuizViewModel.NUMBER_OF_QUESTIONS,
                table: this.table(),
                tables: this.tables().length > 0 ? this.tables() : null,
                maxFactor: this.maxFactor(),
                factRecords: this.buildFactRecords(op),
            };

            if (this.isTraining()) {
                this.questions(generateQuestions(op, exercise, genOptions));
                this.headline(
                    op === 'general'
                        ? `${EXERCISE_LABELS[exercise]} - Entraînement`
                        : `${EXERCISE_LABELS[exercise]} - ${this.getOperationLabel(op)}`
                );
                this.gameModeLabel(exercise === 'sprint' ? 'Sprint' : 'Libre');
                if (exercise === 'sprint') this.startSprintTimer();
                return;
            }

            if (exercise === 'classic' && op !== 'division') {
                this.questions(
                    await loadClassicQuestionsFromJson(
                        op,
                        QuizViewModel.NUMBER_OF_QUESTIONS
                    )
                );
            } else {
                this.questions(generateQuestions(op, exercise, genOptions));
            }

            if (exercise === 'chrono') {
                this.startChronoTimer();
            } else if (exercise === 'sprint') {
                this.startSprintTimer();
            } else if (!this.isTraining() && !this.isFreeInput()) {
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

    private buildFactRecords(op: Operation) {
        const ops: Exclude<Operation, 'general'>[] =
            op === 'general'
                ? ['addition', 'soustraction', 'multiplication', 'division']
                : [op];
        return WeakFactsStore.getRecordsForOps(ops);
    }

    private resolveGameModeLabel(exercise: ExerciseType): string {
        if (exercise === 'chrono') return '60s';
        if (exercise === 'sprint') return 'Sprint';
        if (this.isTraining()) return 'Libre';
        return 'Chrono';
    }

    private startPerQuestionTimer() {
        this.timers.startCountdown(
            QuizViewModel.TIME_LEFT,
            (secondsLeft) => this.timeLeft(secondsLeft),
            () => {
                this.totalAnswered(this.totalAnswered() + 1);
                this.moveToNextQuestion();
            }
        );
    }

    private startChronoTimer() {
        this.timers.startCountdown(
            QuizViewModel.CHRONO_TOTAL_TIME,
            (secondsLeft) => this.timeLeft(secondsLeft),
            () => this.finalizeQuiz()
        );
    }

    private startSprintTimer() {
        this.timers.startCountUp((elapsed) => this.sprintElapsed(elapsed));
    }

    private moveToNextQuestion() {
        this.answerChosen(false);

        if (this.exerciseType() === 'chrono') {
            if (this.timeLeft() <= 0) {
                this.finalizeQuiz();
                return;
            }
            this.currentIndex(this.currentIndex() + 1);
            this.ensureChronoQuestionBuffer();
            return;
        }

        const nextIndex = this.currentIndex() + 1;
        if (nextIndex < this.totalQuestions()) {
            this.currentIndex(nextIndex);
        } else if (this.isUnlimitedTraining()) {
            this.refillTrainingBatch();
        } else {
            this.finalizeQuiz();
        }
    }

    private refillTrainingBatch() {
        const op = this.currentOperation();
        const exercise = this.exerciseType();
        const genOptions = {
            count: QuizViewModel.NUMBER_OF_QUESTIONS,
            table: this.table(),
            tables: this.tables().length > 0 ? this.tables() : null,
            maxFactor: this.maxFactor(),
            factRecords: this.buildFactRecords(op),
        };
        this.questions(generateQuestions(op, exercise, genOptions));
        this.currentIndex(0);
        this.userInput('');
        this.lastAnswerFeedback('');
    }

    quitTraining = () => {
        this.finalizeQuiz();
    };

    private ensureChronoQuestionBuffer() {
        if (this.totalQuestions() - this.currentIndex() > 10) return;
        const extra = generateQuestions(this.currentOperation(), 'chrono', {
            count: QuizViewModel.CHRONO_BATCH_SIZE,
            tables: this.tables().length > 0 ? this.tables() : null,
            factRecords: this.buildFactRecords(this.currentOperation()),
        });
        this.questions([...this.questions(), ...extra]);
    }

    private finalizeQuiz() {
        this.timers.stopAll();
        if (!this.scoreSaved) {
            if (this.exerciseType() === 'sprint') {
                this.saveSprintBestTime();
            } else {
                this.saveBestScore();
            }
            this.scoreSaved = true;
        }
        this.quizFinished(true);
    }

    // -------------------------------------------------------------------------
    // Score / time persistence
    // -------------------------------------------------------------------------

    private saveBestScore() {
        const currentScore = this.score();
        const currentTotal = this.isUnlimitedTraining()
            ? this.totalAnswered()
            : this.totalQuestions();
        const best = QuizScoreStore.saveBestScore(
            this.currentOperation(),
            this.exerciseType(),
            this.isTraining(),
            this.table(),
            this.tables().length > 1,
            currentScore,
            currentTotal
        );
        if (best) {
            this.bestScoreLabel(
                this.formatBestScoreLabel(best.score, best.total)
            );
        }
    }

    private saveSprintBestTime() {
        const table = this.table();
        if (table === null) return;
        // Only record a time if the run was perfect
        if (this.score() < this.totalQuestions()) return;

        const { time, isNewRecord } = QuizScoreStore.saveSprintBestTime(
            this.currentOperation(),
            table,
            this.sprintElapsed()
        );
        const label = isNewRecord ? `${time}s ⚡` : `${time}s`;
        this.bestTimeLabel(label);
        this.bestScoreLabel(label);
    }

    private loadBestScoreLabel(
        op: Operation,
        exercise: ExerciseType,
        isTraining: boolean
    ): string {
        const stored = QuizScoreStore.loadBestScore(
            op,
            exercise,
            isTraining,
            this.table(),
            this.tables().length > 1
        );
        return stored
            ? this.formatBestScoreLabel(stored.score, stored.total)
            : 'Aucun record';
    }

    private loadSprintBestTimeLabel(
        op: Operation,
        table: number | null
    ): string {
        const stored = QuizScoreStore.loadSprintBestTime(op, table);
        return stored !== null ? `${stored}s` : 'Aucun record';
    }

    private formatBestScoreLabel(score: number, total: number): string {
        return this.exerciseType() === 'chrono'
            ? `${score} pts`
            : `${score}/${total}`;
    }

    private getOperationLabel(op: Operation): string {
        if (op === 'soustraction') return 'Soustraction';
        if (op === 'multiplication') return 'Multiplication';
        if (op === 'division') return 'Division';
        if (op === 'general') return 'Mix';
        return 'Addition';
    }
}
