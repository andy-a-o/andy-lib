import {AbstractEffect} from "./AbstractEffect";
import {AbstractTimer, TimerListener} from "@andy-lib/util";

export abstract class TimerEffect extends AbstractEffect implements TimerListener {
    private time: number = 0;

    /**
     * @param duration Effect duration, in milliseconds.
     * @param timer {Timer} Effect timer.
     * @param delay {int} Effect delay.
     */
    constructor(private duration: number, private timer: AbstractTimer, delay?: number) {
        super(delay);
        this.timer.addTimerListener(this);
    }

    /**
     * @param duration Effect duration, in milliseconds.
     */
    setDuration(duration: number) {
        this.duration = duration;
    }

    /**
     * @return effect diration, in milliseconds
     */
    getDuration(): number {
        return this.duration;
    }

    /**
     * Sets the timer for the effect.
     */
    setTimer(timer: AbstractTimer) {
        this.timer = timer;
    }

    getTimer(): AbstractTimer {
        return this.timer;
    }

    /**
     * @return time elapsed
     */
    getTime(): number {
        return this.time;
    }

    /**
     * Starts playback.
     *
     * @param time effect time in milliseconds
     */
    play(time?: number): boolean {
        if (super.play()) {
            this.time = time || 0;
            return true;
        }
        return false;
    }

    /**
     * Stops effect playback.
     */
    stop(): boolean {
        if (super.stop()) {
            this.timer.stop();
            return true;
        }
        return false;
    }

    /**
     * Pauses effect playback.
     */
    pause(): boolean {
        if (super.pause()) {
            this.timer.pause();
            return true;
        }
        return false;
    }

    /**
     * Resumes effect playback.
     */
    resume(): boolean {
        if (super.resume()) {
            this.timer.resume();
            return true;
        }
        return false;
    }

    /**
     * Calls on timer.
     */
    onTimer() {
        if (this.isPlaying()) {
            const now = Date.now();
            this.time += (now - this.startTime);
            this.startTime = now;
            if (this.time > this.duration) {
                this.finished();
            } else {
                this.playback();
            }
        }
    }

    /**
     * Performs effect playback on each timer iteration.
     */
    abstract playback();

    protected started() {
        super.started();
        this.timer.start();
    }

    protected finished() {
        super.finished();
        this.timer.stop();
    }
}