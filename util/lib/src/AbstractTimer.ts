import {Listeners} from "./Listeners";

export interface TimerListener {
    onTimerStarted?(timer: AbstractTimer);
    onTimerPaused?(timer: AbstractTimer);
    onTimerResumed?(timer: AbstractTimer);
    onTimerStopped?(timer: AbstractTimer);
    onTimer?(timer: AbstractTimer);
}

export abstract class AbstractTimer {

    private readonly listeners = new Listeners<TimerListener>([
        "onTimerStarted",
        "onTimerPaused",
        "onTimerResumed",
        "onTimerStopped",
        "onTimer"
    ]);

    addTimerListener(l: TimerListener) {
        this.listeners.add(l);
    }

    removeTimerListener(l: TimerListener) {
        this.listeners.remove(l);
    }

    abstract start();

    abstract stop();

    abstract pause();

    abstract resume();

    abstract isStarted(): boolean;

    abstract getStartTime(): number | undefined;

    protected fireTimer() {
//        Profiler.begin("timer");
        this.listeners.call("onTimer", [this]);
//        Profiler.end("timer");
    }

    protected fireStarted() {
        this.listeners.call("onTimerStarted", [this]);
    }

    protected firePaused() {
        this.listeners.call("onTimerPaused", [this]);
    }

    protected fireResumed() {
        this.listeners.call("onTimerResumed", [this]);
    }

    protected fireStopped() {
        this.listeners.call("onTimerStopped", [this]);
    }
}