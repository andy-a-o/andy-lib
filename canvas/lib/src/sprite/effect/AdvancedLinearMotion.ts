import {Easing, EasingType, HasPosition, LinearMotion} from "@andy-lib/effect";
import {AbstractTimer} from "@andy-lib/util";

export interface AdvancedLinearMotionConfig {
    start?: { x?: number | undefined, y?: number | undefined } | undefined;
    end?: { x?: number | undefined, y?: number | undefined } | undefined;
    dx?: number | undefined;
    dy?: number | undefined;
}

export class AdvancedLinearMotion extends LinearMotion {

    constructor(target: HasPosition, duration: number, timer: AbstractTimer, easing: Easing,
                easingType: EasingType,
                private res: AdvancedLinearMotionConfig) {
        super(target, duration, timer, 0, 0, easing, easingType);
    }

    play(time?: number): boolean {
        const res = this.res;
        const target = this.getTarget();
        const startX = res.start && (res.start.x !== undefined) ? res.start.x : target.getX();
        const startY = res.start && (res.start.y !== undefined) ? res.start.y : target.getY();
        const endX = res.end && (res.end.x !== undefined)
            ? res.end.x
            : (res.dx !== undefined)
                ? startX + res.dx
                : target.getX();
        const endY = res.end && (res.end.y !== undefined)
            ? res.end.y
            : (res.dy !== undefined)
                ? startY + res.dy
                : target.getY();
        this.setStartPositionXY(startX, startY);
        this.setEndPositionXY(endX, endY);
        return super.play(time);
    }
}