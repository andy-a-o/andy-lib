import {AbstractShape, ShapeConfig} from "./AbstractShape";

export interface CircleConfig extends ShapeConfig {
    radius: number;
    angle?: {
        /**
         * Angle in radians
         */
        start?: number | undefined,
        /**
         * Angle in radians
         */
        end?: number | undefined
    } | undefined;
}

export class Circle extends AbstractShape {
    private readonly radius: number;
    private startAngle: number;
    private endAngle: number;

    constructor(res: CircleConfig) {
        super({...res, x: res.x - res.radius, y: res.y - res.radius, w: res.radius * 2, h: res.radius * 2} as ShapeConfig);
        this.radius = res.radius;
        this.startAngle = (res.angle && res.angle.start) || 0;
        this.endAngle = (res.angle && res.angle.end) || 2 * Math.PI;
    }

    /**
     * @param angle Angle in radians.
     */
    setStartAngle(angle: number) {
        if (this.startAngle != angle) {
            this.startAngle = angle;
            this.setDirty(true);
        }
    }

    /**
     * @param angle Angle in radians.
     */
    setEndAngle(angle: number) {
        if (this.endAngle != angle) {
            this.endAngle = angle;
            this.setDirty(true);
        }
    }

    /**
     * @return {Number}
     */
    getStartAngle(): number {
        return this.startAngle;
    }

    /**
     * @return {Number}
     */
    getEndAngle(): number {
        return this.endAngle;
    }

    getRadius(): number {
        return this.radius;
    }

    protected renderShape(ctx: CanvasRenderingContext2D, stroke: boolean, fill: boolean) {
        const radius = this.radius;
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, this.startAngle, this.endAngle, false);
        ctx.moveTo(radius, radius);
        ctx.closePath();
        if (fill) {
            ctx.fill();
        }
        if (stroke) {
            ctx.stroke();
        }
    }
}