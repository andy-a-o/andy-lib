import {RenderObject, RenderObjectConfig} from "../RenderObject";
import {Profiler} from "@andy-lib/profiler";

export interface ShapeConfig extends RenderObjectConfig {
    color?: string | undefined;
    border?: { color?: string | undefined, width?: number | undefined } | undefined;
}

export abstract class AbstractShape extends RenderObject {
    private color: string | undefined;
    private stroke: boolean | undefined;
    private strokeStyle: string | undefined;
    private strokeWidth: number | undefined;

    constructor(res: ShapeConfig) {
        super(res);
        res.color && (this.color = res.color);
        if (res.border) {
            this.stroke = true;
            res.border.color && (this.strokeStyle = res.border.color);
            res.border.width && (this.strokeWidth = res.border.width);
        }
    }

    getColor(): string {
        return this.color;
    }

    setColor(color: string) {
        if (this.color != color) {
            this.color = color;
            this.setDirty(true);
        }
    }

    protected render(ctx: CanvasRenderingContext2D) {
        Profiler.begin("render");
        if (this.color) {
            ctx.fillStyle = this.color;
        }
        if (this.stroke) {
            ctx.strokeStyle = this.strokeStyle;
            ctx.lineWidth = this.strokeWidth;
        }
        this.renderShape(ctx, !!this.stroke, !!this.color);
        Profiler.end("render");
    }

    protected abstract renderShape(ctx: CanvasRenderingContext2D, stroke: boolean, fill: boolean);
}