import {Button, ButtonConfig} from "./Button";
import {Timer, TimerListener} from "@andy-lib/util";
import {Stage} from "../Stage";

export class BlinkingButton extends Button implements TimerListener {
    private readonly timer: Timer;
    private blinking: boolean = false;

    constructor(res: ButtonConfig) {
        super(res);
        this.timer = new Timer(250);
        this.timer.addTimerListener(this);
    }

    onAdded(stage: Stage) {
        super.onAdded(stage);
        this.resumeBlinking();
    }

    onTimer() {
        if (this.isEnabled()) {
            this.setFrame((this.frame == 0) ? 1 : 0);
        }
    }

    onStageStarted(stage: Stage) {
        super.onStageStarted(stage);
        this.resumeBlinking();
    }

    onStageStopped(stage: Stage) {
        super.onStageStopped(stage);
        this.timer.stop();
    }

    startBlinking() {
        this.blinking = true;
        this.timer.start();
    }

    stopBlinking() {
        this.blinking = false;
        this.timer.stop();
    }

    private resumeBlinking() {
        if (this.isVisible() && this.blinking) {
            this.timer.start();
        }
    }
}