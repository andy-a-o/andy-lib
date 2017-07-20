import {Tween, EasingType} from "./Tween";
import {HasOpacity} from "./HasOpacity";
import {Easing} from "./easing/Easing";
import {AbstractTimer} from "@andy-lib/util";

export class FadeOut extends Tween {

    /**
     * @param target Effect target.
     * @param duration Effect duration, in milliseconds.
     * @param timer Effect timer.
     * @param easing Easing effect.
     * @param easingType Easing type.
     */
    constructor(private target: HasOpacity, duration: number,
                timer: AbstractTimer, easing: Easing,
                easingType: EasingType = "easeIn") {
        super(duration, timer, 0, target.getOpacity(), easing, easingType);
    }

    playback() {
        this.target.setOpacity(this.getEndPosition() - this.getPosition());
    }

    play() {
        if (super.play()) {
            this.target.setOpacity(this.getEndPosition());
            return true;
        }
        return false;
    }

    protected finished() {
        this.target.setOpacity(this.getStartPosition());
        super.finished();
    }
}