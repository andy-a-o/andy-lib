import {AbstractShape} from "./AbstractShape";

export class Rectangle extends AbstractShape {

    protected renderShape(ctx: CanvasRenderingContext2D, stroke: boolean, fill: boolean) {
        if (fill) {
            ctx.fillRect(0, 0, this.w, this.h);
        }
        if (stroke) {
            ctx.strokeRect(0, 0, this.w, this.h);
        }
    }
}