import {EasingType, Tween} from "./Tween";
import {Easing} from "./easing/Easing";
import {AbstractTimer} from "@andy-lib/util";

export interface HasScale {
    /**
     * @param scale 0..100
     */
    setScale(scale: number);
}

export class Scale extends Tween {

    /**
     * @param target Effect target.
     * @param duration Effect duration, in milliseconds.
     * @param timer Effect timer.
     * @param initialScale Initial scale (0-100).
     * @param finalScale Final scale (0-100).
     * @param easing Easing effect.
     * @param easingType Easing type.
     */
    constructor(private target: HasScale, duration: number, timer: AbstractTimer, initialScale: number, finalScale: number,
                easing: Easing, easingType: EasingType = "easeIn") {
        super(duration, timer, initialScale, finalScale, easing, easingType);
    }

    setTarget(target: HasScale) {
        this.target = target;
    }

    getTarget(): HasScale {
        return this.target;
    }

    play(time?: number): boolean {
        this.target.setScale(this.getStartPosition());
        return super.play(time);
    }

    playback() {
        this.target.setScale(this.getPosition());
    }

    protected finished() {
        this.target.setScale(this.getEndPosition());
        super.finished();
    }
}