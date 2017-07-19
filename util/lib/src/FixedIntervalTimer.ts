import {AbstractTimer} from "./AbstractTimer";

export abstract class FixedIntervalTimer extends AbstractTimer {
    private interval: number;
    private startTime: number | undefined;
    private timerId: any | undefined;
    private timePassed: number | undefined;
    private intervalHandler: () => void;
    private paused: boolean = false;

    /**
     * @param interval Timer interval, in milliseconds (default is 1000).
     */
    constructor(interval?: number) {
        super();
        this.interval = (interval !== undefined) ? interval : 1000;
        this.intervalHandler = () => {
            this.fireTimer();
            this.restart(this.interval);
        };
    }

    /**
     * @param interval Timer interval in millis
     */
    setInterval(interval: number) {
        this.interval = interval;
        if (this.startTime) {
            this.restart(interval - (Date.now() - this.startTime));
        }
    }

    /**
     * @return Timer interval in millis.
     */
    getInterval(): number {
        return this.interval;
    }

    start() {
        if (this.timerId) {
            return;
        }
        this.fireStarted();
        this.timePassed = 0;
        this.timerId = this.setTimeout(this.intervalHandler, this.interval);
        this.startTime = Date.now();
    }

    stop() {
        if (this.timerId) {
            this.clearTimeout(this.timerId);
            this.timerId = undefined;
            this.startTime = undefined;
            this.timePassed = undefined;
            this.fireStopped();
        }
    }

    pause() {
        if (!this.timerId) {
            return;
        }
        this.clearTimeout(this.timerId);
        this.timerId = undefined;
        this.timePassed += (Date.now() - this.startTime);
        this.paused = true;
        this.firePaused();
    }

    resume() {
        if (!this.paused) {
            return;
        }
        this.timerId = this.setTimeout(this.intervalHandler, this.interval - this.timePassed);
        this.startTime = Date.now();
        this.paused = false;
        this.fireResumed();
    }

    isStarted(): boolean {
        return !!this.timerId;
    }

    getStartTime(): number | undefined {
        return this.startTime;
    }

    protected abstract setTimeout(handler: () => void, timeout: number): any;

    protected abstract clearTimeout(timerId: any);

    private restart(timeout: number) {
        if (this.timerId) {
            this.timePassed = 0;
            this.clearTimeout(this.timerId);
            this.timerId = this.setTimeout(this.intervalHandler, timeout);
            this.startTime = Date.now();
        }
    }
}