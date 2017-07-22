import {Listeners} from "@andy-lib/util";
import {Profiler} from "@andy-lib/profiler";

export interface PauseListener {
    onGamePaused?();

    onGameResumed?();
}

export class PauseController {

    protected constructor() {
    }

    static addPauseListener(l: PauseListener) {
        PauseController.listeners.add(l);
    }

    static removePauseListener(l: PauseListener) {
        PauseController.listeners.remove(l);
    }

    static setPaused(p: boolean) {
        if (PauseController.paused != p) {
            PauseController.paused = p;
            if (PauseController.paused) {
                Profiler.event("paused");
                PauseController.firePaused();
            } else {
                Profiler.event("resumed");
                PauseController.fireResumed();
            }
        }
    }

    static isPaused(): boolean {
        return PauseController.paused;
    }

    private static firePaused() {
        PauseController.listeners.call("onPaused");
    }

    private static fireResumed() {
        PauseController.listeners.call("onResumed");
    }

    private static paused = false;
    private static readonly listeners = new Listeners<PauseListener>([
        "onPaused",
        "onResumed"
    ]);
}

