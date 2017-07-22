import {DisplayObject, DisplayObjectConfig} from "./DisplayObject";
import {Rect} from "../util/Rect";
import {Stage, StageListener} from "./Stage";
import {Sprites} from "../util/Sprites";
import {Profiler} from "@andy-lib/profiler";

/**
 * The layer has its own canvas and draws its children on it.
 * Unlike {@link Group}, it doesn't render anything.
 */
export class Layer extends DisplayObject implements StageListener {
    private readonly canvas: HTMLCanvasElement;
    private readonly layerRect: Rect = new Rect(0, 0, 0, 0);
    private ctx: CanvasRenderingContext2D;

    constructor(res: DisplayObjectConfig) {
        super(res);
        this.canvas = this.createCanvas(res.w, res.h);
        this.ctx = this.canvas.getContext("2d");
    }

    onAdded(stage: Stage) {
        super.onAdded(stage);
        stage.addStageListener(this);
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

    protected getImageData(x: number, y: number): Uint8ClampedArray {
        return this.ctx.getImageData(
            x - this.x,
            y - this.y,
            1, 1).data;
    }

    draw(ctx: CanvasRenderingContext2D, rect: Rect) {
        const r = this.layerRect.resetFrom(rect).intersect(this);
        if (!r.isEmpty()) {
            this.ctx.clearRect(r.x - this.x, r.y - this.y, r.w, r.h);
            const dx = -this.x;
            const dy = -this.y;
            this.ctx.translate(dx, dy);
            const children = this.getChildren();
            for (let i = 0, n = children.length; i < n; ++i) {
                children[i].draw(this.ctx, r);
            }
            this.ctx.translate(-dx, -dy);
            Profiler.begin("draw");
            ctx.drawImage(
                this.canvas,
                r.x - this.x, r.y - this.y, r.w, r.h,
                r.x, r.y, r.w, r.h
            );
            Profiler.end("draw");
            Sprites.applyFilters(this, ctx, r.x, r.y, r.w, r.h);
        }
    }

    protected createCanvas(w: number, h: number): HTMLCanvasElement {
        return Sprites.createCanvas(w, h);
    }
}