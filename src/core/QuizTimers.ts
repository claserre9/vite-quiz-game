/**
 * Manages the quiz's two mutually-exclusive timer kinds: a countdown (used by the
 * per-question timer and the chrono mode) and a count-up (used by sprint mode).
 * Framework-agnostic — callers pass plain callbacks to update their own state.
 */
export class QuizTimers {
    private countdownId: number | null = null;
    private countUpId: number | null = null;

    startCountdown(
        initialSeconds: number,
        onTick: (secondsLeft: number) => void,
        onTimeout: () => void
    ): void {
        this.stopCountdown();
        let secondsLeft = initialSeconds;
        onTick(secondsLeft);
        this.countdownId = window.setInterval(() => {
            secondsLeft -= 1;
            onTick(secondsLeft);
            if (secondsLeft <= 0) {
                this.stopCountdown();
                onTimeout();
            }
        }, 1000);
    }

    stopCountdown(): void {
        if (this.countdownId !== null) {
            clearInterval(this.countdownId);
            this.countdownId = null;
        }
    }

    startCountUp(onTick: (elapsedSeconds: number) => void): void {
        this.stopCountUp();
        let elapsed = 0;
        onTick(elapsed);
        this.countUpId = window.setInterval(() => {
            elapsed += 1;
            onTick(elapsed);
        }, 1000);
    }

    stopCountUp(): void {
        if (this.countUpId !== null) {
            clearInterval(this.countUpId);
            this.countUpId = null;
        }
    }

    stopAll(): void {
        this.stopCountdown();
        this.stopCountUp();
    }
}
