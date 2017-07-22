import {DisplayObject} from "../DisplayObject";
import {HasPosition} from "@andy-lib/effect";

export class MotionAdapter implements HasPosition {

    constructor(private readonly sprite: DisplayObject) {
        sprite.setCanMove(true);
    }

    move(x: number, y: number) {
        this.sprite.move(x, y);
    }

    getX(): number {
        return this.sprite.x;
    }

    getY(): number {
        return this.sprite.y;
    }
}