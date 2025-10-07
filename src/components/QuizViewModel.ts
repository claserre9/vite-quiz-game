import { BaseViewModel } from "../core/BaseViewModel";
import { observable, observableArray, pureComputed } from "knockout";
import incorrectSoundObject from "../medias/sounds/incorrect.mp3";
import correctSoundObject from "../medias/sounds/correct.mp3";


interface Answer {
    answer: string;
    correct: boolean;
}

interface Question {
    question: string;
    answers: Answer[];
    selectedAnswer: KnockoutObservable<Answer | null>;
}

export class QuizViewModel extends BaseViewModel {
    public static TIME_LEFT = 15;
    public static NUMBER_OF_QUESTIONS = 20
    public isLoading = observable(true);
    public errorMessage = observable(null as string | null);
    public questions = observableArray<Question>([]);
    public currentIndex = observable(0);
    public score = observable(0);
    public answerChosen = observable(false);
    public quizFinished = observable(false);

    // training mode flags
    public isTraining = observable(false);
    public table = observable<number | null>(null);

    public timeLeft = observable(QuizViewModel.TIME_LEFT);
    private timerId: number | null = null;

    public scoreEvaluation = pureComputed(() => {
        const s = this.score();
        if (s >= 18) return "🏆 Parfait ! Tu es un champion !";
        if (s >= 16) return "🌟 Excellent travail !";
        if (s >= 14) return "😅 Pas terrible, mais ça peut aller...";
        if (s >= 12) return "🤦 Mouais, tu peux mieux faire quand même";
        if (s >= 10) return "😬 C'est la moyenne, un peu faible non ?";
        if (s >= 8) return "🙈 Aïe aïe aïe, c'est pas glorieux...";
        return "💩 Catastrophique ! Retourne réviser !";
    });

    public currentQuestion = pureComputed(() => {
        const index = this.currentIndex();
        const questions = this.questions();
        return questions && questions.length > index ? questions[index] : null;
    });

    public totalQuestions = pureComputed(() => this.questions().length);
    private correctSoundObject: HTMLAudioElement;
    private incorrectSoundObject: HTMLAudioElement;

    constructor(context: PageJS.Context | undefined) {
        super(context);

        // detect training mode & table from querystring
        const params = new URLSearchParams(context?.querystring || '');
        const mode = params.get('mode');
        const tableParam = params.get('table');
        this.isTraining(mode === 'training');
        this.table(tableParam !== null && tableParam !== '' ? Number(tableParam) : null);

        this.correctSoundObject = new Audio(correctSoundObject);
        this.incorrectSoundObject = new Audio(incorrectSoundObject);

        this.correctSoundObject.preload = "auto";
        this.incorrectSoundObject.preload = "auto";

        this.setTemplate(this.getTemplate());

        this.currentIndex.subscribe(() => {
            if (!this.quizFinished() && !this.isTraining()) {
                this.startTimer();
            }
        });
        this.loadQuestions().then(() => console.log('loaded'));
    }

    private getTemplate(): string {
        const basePath = '/';
        return `
        <div class="container my-4 position-relative">
            
            <div data-bind="visible: isLoading()">
                <p class="text-center">🧠 Chargement en cours... Prépare-toi pour un super quiz !</p>
            </div>

            <div data-bind="visible: errorMessage()" class="alert alert-danger text-center">
                <p data-bind="text: errorMessage"></p>
                <button data-bind="click: loadQuestions" class="btn btn-outline-danger mt-2">🔁 Réessayer</button>
            </div>

            <div data-bind="if: !isLoading() && !errorMessage()">
                <a href="${basePath}" class="btn btn-sm btn-primary position-absolute top-0 start-0">🏠 Accueil</a>
                <div class="d-flex min-vh-100 align-items-center justify-content-center">
                    <div class="card w-100" style="max-width: 640px;">
                        <div class="card-body">
                        <div data-bind="if: !quizFinished() && currentQuestion()">
                            <div class="d-flex justify-content-between bg-light p-2 rounded mb-2">
                                <div>
                                  <span data-bind="visible: !isTraining()">Question <span data-bind="text: currentIndex() + 1"></span>/<span data-bind="text: totalQuestions"></span></span>
                                  <span data-bind="visible: isTraining">Mode Entraînement</span>
                                </div>
                                <div data-bind="visible: !isTraining()"><strong>⏰ <span data-bind="text: timeLeft"></span>s</strong></div>
                            </div>
                            <div class="progress mb-3" data-bind="visible: !isTraining()">
                                <div class="progress-bar" role="progressbar" data-bind="style: { width: ((currentIndex()+1)/totalQuestions()*100 + '%') }"></div>
                            </div>
                            <h2 class="h5 text-center mb-3" data-bind="text: currentQuestion().question"></h2>
                            <div class="d-grid gap-2" data-bind="foreach: currentQuestion().answers">
                                <button class="btn btn-secondary" data-bind="text: '🎈 ' + answer, click: $root.selectAnswer, css: $parent.getAnswerClasses($parent.currentQuestion(), $data), disable: $parent.answerChosen() || $parent.quizFinished()"></button>
                            </div>
                            <div class="text-center mt-3">🎯 Score : <strong data-bind="text: score"></strong>/<span data-bind="text: totalQuestions"></span></div>
                        </div>

                        <div data-bind="if: quizFinished()" class="text-center mt-4">
                            <h2>🎉 Tu as terminé !</h2>
                            <h3 data-bind="text: scoreEvaluation"></h3>
                            <h4>🌈 Ton score final : <strong data-bind="text: score"></strong>/<span data-bind="text: totalQuestions"></span></h4>
                            <button data-bind="click: restart" class="btn btn-primary mt-3">🔄 Recommencer</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    shuffleArray(array: Question[] | Answer[]) {
        if (!array) return [];
        const newArray = array.slice();
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    selectAnswer = async (answer: Answer) => {
        if (this.answerChosen() || !this.currentQuestion()) return;

        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }

        this.currentQuestion()?.selectedAnswer(answer);
        this.answerChosen(true);
        if (answer.correct) {
            void this.correctSoundObject.play();
            this.score(this.score() + 1);
        } else {
            void this.incorrectSoundObject.play();
        }

        setTimeout(() => {
            this.moveToNextQuestion();
        }, 800);
    }

    async restart() {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.timeLeft(QuizViewModel.TIME_LEFT);
        await this.loadQuestions(this.context?.params?.operation);
        this.currentIndex(0);
        this.score(0);
        this.quizFinished(false);
        this.answerChosen(false);
    }

    private startTimer() {
        if (this.quizFinished() || this.isTraining()) return;

        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }

        this.timeLeft(QuizViewModel.TIME_LEFT);
        this.timerId = window.setInterval(() => {
            this.timeLeft(this.timeLeft() - 1);
            if (this.timeLeft() <= 0) {
                clearInterval(this.timerId!);
                this.timerId = null;
                this.moveToNextQuestion();
            }
        }, 1000);
    }

    private moveToNextQuestion() {
        this.answerChosen(false);
        const nextIndex = this.currentIndex() + 1;
        if (nextIndex < this.totalQuestions()) {
            this.currentIndex(nextIndex);
        } else {
            this.quizFinished(true);
            if (this.timerId !== null) {
                clearInterval(this.timerId);
                this.timerId = null;
            }
        }
    }

    async loadQuestions(operation?: string): Promise<void> {
        try {
            // Resolve operation from param or fallback
            let opParam: string | undefined = typeof operation === 'string' ? operation : this.context?.params?.operation;
            if (!opParam || typeof opParam !== 'string') {
                opParam = 'addition';
            }
            // Normalize: remove leading slash and ensure lower-case
            opParam = String(opParam).replace(/^\/+/, '').toLowerCase();
            const allowed = ['addition', 'soustraction', 'multiplication'] as const;
            type Op = typeof allowed[number];
            const op: Op = (allowed as readonly string[]).includes(opParam) ? (opParam as Op) : 'addition';

            this.isLoading(true);
            this.errorMessage(null);

            // Training mode: generate questions dynamically
            if (this.isTraining()) {
                const generated = this.generateTrainingQuestions(op, this.table());
                this.questions(generated.slice(0, QuizViewModel.NUMBER_OF_QUESTIONS));
                return;
            }

            const loaders: Record<Op, () => Promise<{ default: any }>> = {
                addition: () => import('../json/addition.json'),
                soustraction: () => import('../json/soustraction.json'),
                multiplication: () => import('../json/multiplication.json'),
            };

            const questions = (await loaders[op]()).default;
            const shuffledQuestions = this.shuffleArray(questions);
            const transformedQuestions = shuffledQuestions.map(q => ({
                ...q,
                answers: this.shuffleArray((q as Question).answers as Answer[]),
                selectedAnswer: observable(null),
            }));

            this.questions(transformedQuestions.slice(0, QuizViewModel.NUMBER_OF_QUESTIONS) as Question[]);
        } catch (error) {
            console.error('Error loading questions:', error);
            this.errorMessage("Oups ! Une erreur s'est produite en chargeant les questions.");
        } finally {
            this.isLoading(false);
        }
    }

    getAnswerClasses(question: { selectedAnswer: () => never; }, answer: Answer) {
        if (!question || !question.selectedAnswer()) return null;
        return {
            'btn-success': answer.correct,
            'btn-danger': !answer.correct && answer === question.selectedAnswer(),
        };
    }

    private generateTrainingQuestions(op: 'addition' | 'soustraction' | 'multiplication', table: number | null): Question[] {
        const makeQ = (question: string, correctAnswer: number): Question => {
            const distractors = this.buildDistractors(correctAnswer);
            const answers = this.shuffleArray([
                { answer: String(correctAnswer), correct: true },
                ...distractors.map((n) => ({ answer: String(n), correct: false })),
            ] as Answer[]) as Answer[];
            return { question, answers, selectedAnswer: observable<Answer | null>(null) } as Question;
        };

        const qs: Question[] = [];
        const t = table ?? 2;

        if (op === 'multiplication') {
            for (let n = 0; n <= 12; n++) {
                const result = t * n;
                qs.push(makeQ(`${t} × ${n} = ?`, result));
            }
        } else if (op === 'addition') {
            for (let n = 0; n <= 20; n++) {
                const result = t + n;
                qs.push(makeQ(`${t} + ${n} = ?`, result));
            }
        } else {
            for (let n = 0; n <= 20; n++) {
                const a = t + n; // ensures non-negative results
                const result = a - t;
                qs.push(makeQ(`${a} − ${t} = ?`, result));
            }
        }

        return this.shuffleArray(qs).slice(0, QuizViewModel.NUMBER_OF_QUESTIONS) as Question[];
    }

    private buildDistractors(correct: number): number[] {
        const set = new Set<number>();
        const range = Math.max(2, Math.floor(Math.abs(correct) * 0.2) + 2);
        while (set.size < 3) {
            const delta = Math.floor(Math.random() * range) + 1;
            const sign = Math.random() < 0.5 ? -1 : 1;
            const cand = correct + sign * delta;
            if (cand !== correct && cand >= -100 && cand <= 1000) set.add(cand);
        }
        return Array.from(set);
    }
}
