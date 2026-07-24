import { observable } from 'knockout';
import {
    shuffleArray,
    type Answer,
    type Operation,
    type Question,
} from './QuestionGenerator';

/** Loads pre-authored classic questions from the static JSON banks (addition/soustraction/multiplication). */
export async function loadClassicQuestionsFromJson(
    op: Operation,
    count: number
): Promise<Question[]> {
    const fallback = 'addition' as const;
    const safeOp = op === 'general' || op === 'division' ? fallback : op;
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
        .slice(0, count) as Question[];
}
