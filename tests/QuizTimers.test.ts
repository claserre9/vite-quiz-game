import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuizTimers } from '@core/QuizTimers.ts';

describe('QuizTimers', () => {
    let timers: QuizTimers;

    beforeEach(() => {
        vi.useFakeTimers();
        timers = new QuizTimers();
    });

    afterEach(() => {
        timers.stopAll();
        vi.useRealTimers();
    });

    it('startCountdown ticks immediately with the initial value, then once per second', () => {
        const ticks: number[] = [];
        timers.startCountdown(
            3,
            (secondsLeft) => ticks.push(secondsLeft),
            () => {}
        );

        expect(ticks).toEqual([3]);
        vi.advanceTimersByTime(1000);
        expect(ticks).toEqual([3, 2]);
        vi.advanceTimersByTime(1000);
        expect(ticks).toEqual([3, 2, 1]);
    });

    it('startCountdown calls onTimeout exactly once when it reaches zero, and stops', () => {
        const ticks: number[] = [];
        let timeoutCalls = 0;
        timers.startCountdown(
            2,
            (secondsLeft) => ticks.push(secondsLeft),
            () => timeoutCalls++
        );

        vi.advanceTimersByTime(1000); // -> 1
        vi.advanceTimersByTime(1000); // -> 0, fires timeout
        expect(ticks).toEqual([2, 1, 0]);
        expect(timeoutCalls).toBe(1);

        // Further time should not produce more ticks or timeouts (interval was cleared).
        vi.advanceTimersByTime(5000);
        expect(ticks).toEqual([2, 1, 0]);
        expect(timeoutCalls).toBe(1);
    });

    it('starting a new countdown replaces any previous one', () => {
        const firstTicks: number[] = [];
        const secondTicks: number[] = [];
        timers.startCountdown(
            10,
            (s) => firstTicks.push(s),
            () => {}
        );
        timers.startCountdown(
            5,
            (s) => secondTicks.push(s),
            () => {}
        );

        vi.advanceTimersByTime(1000);

        expect(firstTicks).toEqual([10]); // only the initial tick from the replaced timer
        expect(secondTicks).toEqual([5, 4]);
    });

    it('stopCountdown halts ticking and is safe to call when nothing is running', () => {
        const ticks: number[] = [];
        timers.startCountdown(
            5,
            (s) => ticks.push(s),
            () => {}
        );
        timers.stopCountdown();
        vi.advanceTimersByTime(3000);
        expect(ticks).toEqual([5]);

        expect(() => timers.stopCountdown()).not.toThrow();
    });

    it('startCountUp ticks immediately with 0, then increments once per second', () => {
        const ticks: number[] = [];
        timers.startCountUp((elapsed) => ticks.push(elapsed));

        expect(ticks).toEqual([0]);
        vi.advanceTimersByTime(1000);
        vi.advanceTimersByTime(1000);
        expect(ticks).toEqual([0, 1, 2]);
    });

    it('countdown and count-up run independently of each other', () => {
        const countdownTicks: number[] = [];
        const countUpTicks: number[] = [];
        timers.startCountdown(
            5,
            (s) => countdownTicks.push(s),
            () => {}
        );
        timers.startCountUp((e) => countUpTicks.push(e));

        vi.advanceTimersByTime(1000);
        expect(countdownTicks).toEqual([5, 4]);
        expect(countUpTicks).toEqual([0, 1]);

        timers.stopCountdown();
        vi.advanceTimersByTime(1000);
        expect(countdownTicks).toEqual([5, 4]); // stopped
        expect(countUpTicks).toEqual([0, 1, 2]); // still running
    });

    it('stopAll stops both the countdown and the count-up timer', () => {
        const countdownTicks: number[] = [];
        const countUpTicks: number[] = [];
        timers.startCountdown(
            5,
            (s) => countdownTicks.push(s),
            () => {}
        );
        timers.startCountUp((e) => countUpTicks.push(e));

        timers.stopAll();
        vi.advanceTimersByTime(5000);

        expect(countdownTicks).toEqual([5]);
        expect(countUpTicks).toEqual([0]);
    });
});
