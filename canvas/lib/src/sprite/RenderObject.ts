import {DisplayObject, DisplayObjectConfig} from "./DisplayObject";
import {MirrorType, Sprites} from "../util/Sprites";
import {Stage, StageListener} from "./Stage";
import {HasOpacity} from "@andy-lib/effect";
import {Profiler} from "@andy-lib/profiler";
import {Rect} from "../util/Rect";
import {ErrorReporter} from "@andy-lib/server-resources";

export interface RenderObjectConfig extends DisplayObjectConfig {
    /**
     * Rotation degree.
     */
    rotate?: number | undefined;
    mirror?: MirrorType | undefined;
    /**
     * 0..100
     */
    opacity?: number | undefined;
}

/**
 * A display object which pre-renders itself onto its own canvas
 * via <code>render()</code> method.
 */
export abstract class RenderObject extends DisplayObject implements HasOpacity, StageListener {
    protected readonly angle: number | undefined;
    protected readonly mirror: MirrorType | undefined;
    protected opacity: number | undefined;
    protected alpha: number | undefined;

    private canvas: HTMLCanvasElement | undefined;
    private ctx: CanvasRenderingContext2D | undefined;

    constructor(res: RenderObjectConfig) {
        super(res);
        res.rotate && (this.angle = (res.rotate / 180 * Math.PI));
        res.mirror && (this.mirror = res.mirror);
        if (res.opacity !== undefined) {
            this.opacity = res.opacity;
            this.alpha = this.opacity / 100;
        }

        this.resetCanvas();
    }

    resetCanvas() {
        this.canvas = this.createCanvas(this.w, this.h);
        this.ctx = this.canvas.getContext("2d");
    }

    onAdded(stage: Stage) {
        super.onAdded(stage);
        stage.addStageListener(this);
        if (stage.isStarted()) {
            this.ctx = this.canvas.getContext("2d");
        }
    }

    onRemoved(stage: Stage) {
        super.onRemoved(stage);
        stage.removeStageListener(this);
    }

    onStageStarted(stage: Stage) {
        this.ctx = this.canvas.getContext("2d");
    }

    onStageStopped(stage: Stage) {
        delete this.ctx;
    }

    /**
     * @param o Number from 0 to 100.
     */
    setOpacity(o: number) {
        if (this.opacity != o) {
            this.opacity = o;
            this.alpha = o / 100;
            this.setDirty(true);
        }
    }

    getOpacity(): number {
        return (this.opacity !== undefined) ? this.opacity : 100;
    }

    getRenderContext(): CanvasRenderingContext2D {
        return this.ctx;
    }

    getImageData(x: number, y: number): Uint8ClampedArray {
        return this.ctx.getImageData(
            x - this.x,
            y - this.y,
            1, 1).data;
    }

    protected clearState(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, this.w, this.h);
    }

    protected updateState() {
        let ctx = this.ctx;
        if (!ctx) {
            ctx = this.ctx = this.canvas.getContext("2d");
        }
        ctx.save();
        this.clearState(ctx);
        if (this.opacity < 100) {
            ctx.globalAlpha = this.alpha;
        }
        if (this.mirror) {
            Sprites.mirror(this, ctx, this.mirror, this.getScale());
        } else {
            const scalePercent = this.getScale();
            if (scalePercent != 100) {
                const scale = scalePercent / 100;
                ctx.scale(scale, scale);
            }
        }
        if (this.angle) {
            Sprites.rotate(this, ctx, this.angle);
        }
        this.render(ctx);
        Sprites.applyFilters(this, ctx, 0, 0, this.w, this.h);
        ctx.restore();
    }

    public drawRect(ctx: CanvasRenderingContext2D, src: Rect, dst: Rect) {
        super.drawRect(ctx, src, dst);
        Profiler.begin("draw");
        try {
            ctx.drawImage(
                this.canvas,
                src.x, src.y, src.w, src.h,
                dst.x, dst.y, dst.w, dst.h
            );
        } catch (e) {
            ErrorReporter.error(`Failed to draw sprite ${this.toJSON()} ${src} -> ${dst}: ${e}`, "RenderObject");
        }
        Profiler.end("draw");
    }

    /**
     * Draws display object onto its own canvas.
     */
    protected abstract render(ctx: CanvasRenderingContext2D);

    resize(w: number, h: number): Rect {
        super.resize(w, h);
        this.canvas.width = w;
        this.canvas.height = h;
        this.updateState();
        return this;
    }

    protected createCanvas(w: number, h: number): HTMLCanvasElement {
        return Sprites.createCanvas(w, h);
    }

    toJSON(): any {
        return {
            ...super.toJSON(),
            angle: this.angle,
            mirror: this.mirror,
            opacity: this.opacity
        };
    }
}