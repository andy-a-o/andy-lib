import {AbstractShape, ShapeConfig} from "./AbstractShape";

export interface RoundedRectangleConfig extends ShapeConfig {
    radius: number;
}

export class RoundedRectangle extends AbstractShape {
    private readonly radius: number;

    constructor(res: RoundedRectangleConfig) {
        super(res);
        this.radius = res.radius;
    }

    getRadius(): number {
        return this.radius;
    }

    protected renderShape(ctx: CanvasRenderingContext2D, stroke: boolean, fill: boolean) {
        const radius = this.radius;
        const width = this.w;
        const height = this.h;
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(width - radius, 0);
        ctx.quadraticCurveTo(width, 0, width, radius);
        ctx.lineTo(width, height - radius);
        ctx.quadraticCurveTo(width, height, width - radius, height);
        ctx.lineTo(radius, height);
        ctx.quadraticCurveTo(0, height, 0, height - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        if (fill) {
            ctx.fill();
        }
        if (stroke) {
            ctx.stroke();
        }
    }
}