import {TimerEffect} from "./TimerEffect";
import {Easing} from "./easing/Easing";
import {AbstractTimer} from "@andy-lib/util";

export type EasingType = "easeNone" | "easeIn" | "easeOut" | "easeInOut";

export abstract class Tween extends TimerEffect {

    /**
     * @param duration {int} Effect duration, in milliseconds.
     * @param timer Effect timer.
     * @param begin Start position value.
     * @param end End position value.
     * @param easing Easing effect.
     * @param easingType Easing type.
     */
    constructor(duration: number, timer: AbstractTimer,
                private begin: number,
                private end: number,
                private easing: Easing,
                private easingType: EasingType = "easeIn") {
        super(duration, timer);
    }

    setStartPosition(begin: number) {
        this.begin = begin;
    }

    getStartPosition(): number {
        return this.begin;
    }

    setEndPosition(end: number) {
        this.end = end;
    }

    getEndPosition(): number {
        return this.end;
    }

    getPosition(): number {
        return this.easing[this.easingType](this.getTime(), this.begin,
            this.end - this.begin, this.getDuration());
    }

    setEasing(easing: Easing) {
        this.easing = easing;
    }

    getEasing(): Easing {
        return this.easing;
    }

    setEasingType(type: EasingType) {
        this.easingType = type;
    }

    getEasingType(): EasingType {
        return this.easingType;
    }

    easeIn() {
        this.easingType = "easeIn";
        this.play();
    }

    easeOut() {
        this.easingType = "easeOut";
        this.play();
    }

    easeInOut() {
        this.easingType = "easeInOut";
        this.play();
    }

    easeNone() {
        this.easingType = "easeNone";
        this.play();
    }
}