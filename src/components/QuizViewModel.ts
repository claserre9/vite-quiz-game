import { BaseViewModel } from '../core/BaseViewModel';
import { url } from '../core/url';
import { observable, observableArray, pureComputed } from 'knockout';
import {
    generateQuestions,
    shuffleArray,
    type Operation,
    type ExerciseType,
    type Answer,
    type Question,
} from '../core/QuestionGenerator';
import incorrectSoundObject from '../medias/sounds/incorrect.mp3';
import correctSoundObject from '../medias/sounds/correct.mp3';

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
    public maxFactor = observable<number | null>(null);
    public timeLeft = observable(QuizViewModel.TIME_LEFT);
    public exerciseType = observable<ExerciseType>('classic');
    public currentOperation = observable<Operation>('addition');
    public totalAnswered = observable(0);
    public gameModeLabel = observable('Chrono');
    public headline = observable('Quiz classique');
    public bestScoreLabel = observable('Aucun record');

    private timerId: number | null = null;
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

        const total = this.totalQuestions();
        const pct = total > 0 ? s / total : 0;

        if (pct >= 0.95) return '🏆 Parfait ! Tu es un champion !';
        if (pct >= 0.80) return '🌟 Excellent travail !';
        if (pct >= 0.65) return '👍 Très bien, continue comme ça !';
        if (pct >= 0.50) return '😅 Pas mal, mais tu peux faire mieux !';
        if (pct >= 0.35) return "😬 C'est la moyenne, encore un effort !";
        return '💪 Continue à t\'entraîner, ça va venir !';
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
        const tableParam = params.get('table');
        const maxFactorParam = params.get('maxFactor');

        this.isTraining(params.get('mode') === 'training');
        this.table(tableParam !== null && tableParam !== '' ? Number(tableParam) : null);
        this.maxFactor(maxFactorParam !== null && maxFactorParam !== '' ? Number(maxFactorParam) : null);
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

            if (!this.isTraining()) {
                this.startPerQuestionTimer();
            }
        });

        void this.loadQuestions();
    }

    private getTemplate(): string {
        const basePath = url('/');
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
                                <div class="qm-score-item">
                                    <span class="qm-score-label">Record</span>
                                    <span class="qm-score-value qm-score-value-sm" data-bind="text: bestScoreLabel"></span>
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
        this.scoreSaved = false;
        await this.loadQuestions(this.context?.params?.operation);
    }

    async loadQuestions(operation?: string): Promise<void> {
        try {
            const op = this.parseOperation(operation ?? this.context?.params?.operation);
            const exercise = this.exerciseType();

            this.isLoading(true);
            this.errorMessage(null);
            this.stopTimer();
            this.currentIndex(0);
            this.quizFinished(false);
            this.answerChosen(false);
            this.scoreSaved = false;
            this.currentOperation(op);
            this.headline(
                op === 'general'
                    ? EXERCISE_LABELS[exercise]
                    : `${EXERCISE_LABELS[exercise]} - ${this.getOperationLabel(op)}`
            );
            this.gameModeLabel(this.resolveGameModeLabel(exercise));
            this.totalAnswered(0);
            this.questions([]);
            this.bestScoreLabel(this.loadBestScoreLabel(op, exercise, this.isTraining()));

            if (this.isTraining()) {
                this.questions(
                    generateQuestions(op, exercise, {
                        count: QuizViewModel.NUMBER_OF_QUESTIONS,
                        table: this.table(),
                        maxFactor: this.maxFactor(),
                    })
                );
                this.headline(
                    op === 'general'
                        ? `${EXERCISE_LABELS[exercise]} - Entraînement`
                        : `${EXERCISE_LABELS[exercise]} - ${this.getOperationLabel(op)}`
                );
                this.gameModeLabel('Libre');
                return;
            }

            if (exercise === 'classic') {
                this.questions(await this.loadClassicQuestionsFromJson(op));
            } else {
                this.questions(
                    generateQuestions(op, exercise, { count: QuizViewModel.NUMBER_OF_QUESTIONS })
                );
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
            this.errorMessage("Oups ! Une erreur s'est produite en chargeant les questions.");
        } finally {
            this.isLoading(false);
        }
    }

    getAnswerClasses(question: Question | null, answer: Answer) {
        if (!question || !question.selectedAnswer()) return null;
        return {
            'btn-success': answer.correct,
            'btn-danger': !answer.correct && answer === question.selectedAnswer(),
        };
    }

    private parseOperation(operation?: string): Operation {
        const value = String(operation || 'addition').replace(/^\/+/, '').toLowerCase();
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

    private async loadClassicQuestionsFromJson(op: Operation): Promise<Question[]> {
        const fallback = 'addition' as const;
        const safeOp = op === 'general' ? fallback : op;
        const loaders = {
            addition: () => import('../json/addition.json'),
            soustraction: () => import('../json/soustraction.json'),
            multiplication: () => import('../json/multiplication.json'),
        };

        const questions = (await loaders[safeOp]()).default;
        return shuffleArray(questions)
            .map((q) => ({
                ...q,
                answers: shuffleArray(q.answers as Answer[]),
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
                this.finalizeQuiz();
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
        } else {
            this.finalizeQuiz();
        }
    }

    private ensureChronoQuestionBuffer() {
        if (this.totalQuestions() - this.currentIndex() > 10) return;
        const extra = generateQuestions(this.currentOperation(), 'chrono', {
            count: QuizViewModel.CHRONO_BATCH_SIZE,
        });
        this.questions([...this.questions(), ...extra]);
    }

    private finalizeQuiz() {
        this.stopTimer();
        if (!this.scoreSaved) {
            this.saveBestScore();
            this.scoreSaved = true;
        }
        this.quizFinished(true);
    }

    private saveBestScore() {
        if (typeof window === 'undefined' || !window.localStorage) return;

        const key = this.getBestScoreKey(this.currentOperation(), this.exerciseType(), this.isTraining());
        const currentScore = this.score();
        const currentTotal = this.totalQuestions();
        const previous = this.parseStoredScore(window.localStorage.getItem(key));

        const currentPct = currentTotal > 0 ? currentScore / currentTotal : 0;
        const previousPct = previous ? previous.score / previous.total : 0;

        if (currentPct > previousPct) {
            window.localStorage.setItem(key, `${currentScore}/${currentTotal}`);
            this.bestScoreLabel(this.formatBestScoreLabel(currentScore, currentTotal));
        } else if (previous) {
            this.bestScoreLabel(this.formatBestScoreLabel(previous.score, previous.total));
        }
    }

    private loadBestScoreLabel(op: Operation, exercise: ExerciseType, isTraining: boolean): string {
        if (typeof window === 'undefined' || !window.localStorage) return 'Aucun record';
        const key = this.getBestScoreKey(op, exercise, isTraining);
        const stored = this.parseStoredScore(window.localStorage.getItem(key));
        return stored ? this.formatBestScoreLabel(stored.score, stored.total) : 'Aucun record';
    }

    private getBestScoreKey(op: Operation, exercise: ExerciseType, isTraining: boolean): string {
        const base = `quiz-math-best:${exercise}:${op}:${isTraining ? 'training' : 'normal'}`;
        const table = this.table();
        if (isTraining && table !== null) return `${base}:t${table}`;
        return base;
    }

    /** Parses "score/total" (new format) or a plain number (legacy format). */
    private parseStoredScore(raw: string | null): { score: number; total: number } | null {
        if (!raw) return null;
        if (raw.includes('/')) {
            const [s, t] = raw.split('/').map(Number);
            return isNaN(s) || isNaN(t) || t === 0 ? null : { score: s, total: t };
        }
        const legacy = Number(raw);
        return isNaN(legacy) || legacy === 0
            ? null
            : { score: legacy, total: QuizViewModel.NUMBER_OF_QUESTIONS };
    }

    private formatBestScoreLabel(score: number, total: number): string {
        return this.exerciseType() === 'chrono' ? `${score} pts` : `${score}/${total}`;
    }

    private getOperationLabel(op: Operation): string {
        if (op === 'soustraction') return 'Soustraction';
        if (op === 'multiplication') return 'Multiplication';
        if (op === 'general') return 'Mix';
        return 'Addition';
    }
}
