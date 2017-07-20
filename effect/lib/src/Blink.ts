import {TimerEffect} from "./TimerEffect";
import {EffectListener} from "./AbstractEffect";
import {AbstractTimer} from "@andy-lib/util";

export interface HasVisibility {
    setVisible(visible: boolean);

    isVisible(): boolean;
}

export class Blink extends TimerEffect implements EffectListener {

    /**
     * @param target Effect target.
     * @param duration Effect duration, in milliseconds.
     * @param timer Effect timer.
     */
    constructor(private target: HasVisibility, duration: number, timer: AbstractTimer) {
        super(duration, timer);
        this.addEffectListener(this);
    }

    onEffectFinished() {
        this.target.setVisible(true);
    }

    playback() {
        this.target.setVisible(!this.target.isVisible());
    }
}