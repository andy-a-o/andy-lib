import {EasingType, Tween} from "./Tween";
import {Easing} from "./easing/Easing";
import {HasOpacity} from "./HasOpacity";
import {AbstractTimer} from "@andy-lib/util";

export class FadeIn extends Tween {

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
        super(duration, timer, target.getOpacity(), 100, easing, easingType);
    }

    playback() {
        this.target.setOpacity(this.getPosition());
    }

    play(): boolean {
        if (super.play()) {
            this.target.setOpacity(this.getStartPosition());
            return true;
        }
        return false;
    }

    protected finished() {
        this.target.setOpacity(this.getEndPosition());
        super.finished();
    }
}