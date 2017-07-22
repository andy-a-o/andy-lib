import {AbstractTimer} from "@andy-lib/util";

export class AnimationFrameTimer extends AbstractTimer {
    private started: boolean;
    private paused: boolean;
    private startTime: number | undefined;
    private readonly timerCallback: () => void;
    private animationFrameId: number;

    constructor() {
        super();
        this.started = false;
        this.paused = false;
        this.timerCallback = () => {
            if (!this.paused) {
                this.fireTimer();
            }
            this.restart();
        };
    }

    start(): boolean {
        if (this.started) {
            return false;
        }
        this.started = true;
        this.startTime = Date.now();
        this.restart();
        this.fireStarted();
        return true;
    }

    stop(): boolean {
        if (!this.started) {
            return false;
        }
        cancelAnimationFrame(this.animationFrameId);
        this.started = false;
        delete this.startTime;
        this.fireStopped();
        return true;
    }

    pause(): boolean {
        if (!this.started || this.paused) {
            return false;
        }
        this.paused = true;
        this.firePaused();
        return true;
    }

    resume(): boolean {
        if (!this.paused) {
            return false;
        }
        this.paused = false;
        this.startTime = Date.now();
        this.fireResumed();
        return true;
    }

    isStarted(): boolean {
        return this.started;
    }

    getStartTime(): number {
        return this.startTime;
    }

    restart() {
        if (this.started) {
            this.animationFrameId = requestAnimationFrame(this.timerCallback);
        }
    }
}