import {Listeners, Timer} from "@andy-lib/util";

export enum EffectState {
    Ready = 1,
    Started = 2,
    Paused = 3,
    Stopped = 4,
    Finished = 5
}

export interface EffectListener {
    onEffectPlaybackStarted?(effect: AbstractEffect);

    onEffectStarted?(effect: AbstractEffect);

    onEffectPaused?(effect: AbstractEffect);

    onEffectStopped?(effect: AbstractEffect);

    onEffectFinished?(effect: AbstractEffect);

    onEffectResumed?(effect: AbstractEffect);
}

export abstract class AbstractEffect {
    private readonly listeners: Listeners<EffectListener> = new Listeners<EffectListener>([
        "onEffectPlaybackStarted",
        "onEffectStarted",
        "onEffectPaused",
        "onEffectStopped",
        "onEffectFinished",
        "onEffectResumed"]);

    private readonly starter: Timer;
    private state: EffectState = EffectState.Ready;
    protected startTime: number | undefined;

    constructor(delay?: number) {
        const self = this;
        this.starter = new Timer(delay || 0);
        this.starter.addTimerListener({
            onTimer: function (timer) {
                timer.stop();
                self.started();
            }
        });
    }

    getDelay(): number {
        return this.starter.getInterval();
    }

    setDelay(delay: number) {
        this.starter.setInterval(delay);
    }

    /**
     * Starts/resumes the effect.
     */
    play(): boolean {
        if ((EffectState.Started === this.state) || (EffectState.Paused === this.state)) {
            return false;
        }
        this.starter.start();
        this.state = EffectState.Started;
        this.firePlaybackStarted();
        return true;
    }

    /**
     * Stops the effect.
     */
    stop(): boolean {
        this.stopped();
        return true;
    }

    /**
     * Pauses the effect the effect.
     */
    pause(): boolean {
        if (this.state !== EffectState.Started) {
            return false;
        }
        this.paused();
        return true;
    }

    /**
     * Resumes effect playback.
     */
    resume(): boolean {
        if (EffectState.Paused !== this.state) {
            return false;
        }
        this.resumed();
        return true;
    }

    protected started() {
        this.fireStarted();
        this.startTime = Date.now();
    }

    protected stopped() {
        this.state = EffectState.Stopped;
        delete this.startTime;
        this.fireStopped();
    }

    protected paused() {
        this.state = EffectState.Paused;
        this.starter.pause();
        this.firePaused();
    }

    protected resumed() {
        this.state = EffectState.Started;
        this.starter.resume();
        this.startTime = Date.now();
        this.fireResumed();
    }

    protected finished() {
        this.state = EffectState.Finished;
        this.fireFinished();
    }

    /**
     * Checks whether the effect is playing.
     */
    isPlaying(): boolean {
        return (EffectState.Started === this.state);
    }

    addEffectListener(listener: EffectListener) {
        this.listeners.add(listener);
    }

    removeEffectListener(listener: EffectListener) {
        this.listeners.remove(listener);
    }

    /**
     * Fires when the effect <code>play</code> method has been called.
     */
    protected firePlaybackStarted() {
        this.listeners.call("onEffectPlaybackStarted", [this]);
    }

    /**
     * Fires when the effect has started.
     */
    protected fireStarted() {
        this.listeners.call("onEffectStarted", [this]);
    }

    /**
     * Fires when the effect has paused.
     */
    protected firePaused() {
        this.listeners.call("onEffectPaused", [this]);
    }

    /**
     * Fires when the effect has stopped.
     */
    protected fireStopped() {
        this.listeners.call("onEffectStopped", [this]);
    }

    /**
     * Fires when the effect has finished.
     */
    protected fireFinished() {
        this.listeners.call("onEffectFinished", [this]);
    }

    /**
     * Fires when the effect has resumed after a pause.
     */
    protected fireResumed() {
        this.listeners.call("onEffectResumed", [this]);
    }
}