import {EasingType, Tween} from "./Tween";
import {Easing} from "./easing/Easing";
import {AbstractTimer} from "@andy-lib/util";

export interface HasPosition {
    getX(): number;

    getY(): number;

    move(x: number, y: number);
}

export class LinearMotion extends Tween {
    private startX: number;
    private startY: number;
    private endX: number;
    private endY: number;

    private beginX: number;
    private beginY: number;
    private cos: number;
    private sin: number;

    /**
     * @param target Effect target.
     * @param duration Effect duration, in milliseconds.
     * @param timer Effect timer.
     * @param x Coordinates of the motion endpoint.
     * @param y Coordinates of the motion endpoint.
     * @param easing Easing effect.
     * @param easingType Easing type.
     */
    constructor(private target: HasPosition, duration: number, timer: AbstractTimer, x: number, y: number, easing: Easing,
                easingType: EasingType = "easeIn") {
        super(duration, timer, 0, Math.sqrt(x * x + y * y), easing, easingType);
        this.startX = target.getX();
        this.startY = target.getY();
        this.endX = x;
        this.endY = y;
    }

    setTarget(target: HasPosition) {
        this.target = target;
    }

    getTarget(): HasPosition {
        return this.target;
    }

    setStartPositionXY(x: number, y: number) {
        this.startX = x;
        this.startY = y;
        const dx = (this.endX - this.startX);
        const dy = (this.endY - this.startY);
        super.setEndPosition(Math.sqrt(dx * dx + dy * dy));
    }

    getStartPositionX(): number {
        return this.startX;
    }

    getStartPositionY(): number {
        return this.startY;
    }

    setEndPositionXY(x: number, y: number) {
        this.endX = x;
        this.endY = y;
        const dx = (this.endX - this.startX);
        const dy = (this.endY - this.startY);
        super.setEndPosition(Math.sqrt(dx * dx + dy * dy));
    }

    getEndPositionX(): number {
        return this.endX;
    }

    getEndPositionY(): number {
        return this.endY;
    }

    play(time?: number): boolean {
        this.target.move(this.startX, this.startY);
        this.beginX = this.startX;
        this.beginY = this.startY;
        const distance = this.getEndPosition() - this.getStartPosition();
        this.cos = (distance > 0) ? (this.endX - this.beginX) / distance : 0;
        this.sin = (distance > 0) ? (this.endY - this.beginY) / distance : 0;
        return super.play(time);
    }

    playback() {
        const position = this.getPosition();
        this.target.move(Math.round(this.beginX + position * this.cos),
            Math.round(this.beginY + position * this.sin));
    }

    finished() {
        const position = this.getEndPosition();
        this.target.move(Math.round(this.beginX + position * this.cos),
            Math.round(this.beginY + position * this.sin));
        super.finished();
    }
}