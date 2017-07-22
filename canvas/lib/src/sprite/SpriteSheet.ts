import {DisplayObject, DisplayObjectConfig} from "./DisplayObject";
import {Profiler} from "@andy-lib/profiler";
import {AugmentedHTMLImageElement, ErrorReporter, ImageResourceConfig} from "@andy-lib/server-resources";
import {MirrorType, Sprites} from "../util/Sprites";
import {Stage, StageListener} from "./Stage";
import {Rect} from "../util/Rect";

export interface SpriteSheetConfig extends DisplayObjectConfig, ImageResourceConfig {

    /**
     * Rotation degree.
     */
    rotate?: number | undefined;
    mirror?: MirrorType | undefined;
    frame?: number | undefined;
    cache?: "none" | "auto" | "force" | undefined;
}

const canvasCache: { [key: string]: HTMLCanvasElement } = {};

/**
 * Image containing multiple sprites.
 */
export class SpriteSheet extends DisplayObject implements StageListener {
    protected readonly img: AugmentedHTMLImageElement;
    private canvas: HTMLCanvasElement;
    private readonly sx: number;
    private readonly sy: number;
    private readonly sw: number;
    private readonly sh: number;
    private readonly angle: number | undefined;
    private readonly mirror: MirrorType | undefined;
    private readonly frameCountX: number;
    private readonly frameCountY: number;
    protected readonly frameCount: number;
    private readonly frameWidth: number;
    private readonly frameHeight: number;
    private readonly canvasOffsetX: number;
    private readonly canvasOffsetY: number;
    private ctx?: CanvasRenderingContext2D | undefined;
    private offsetX?: number | undefined;
    private offsetY?: number | undefined;
    protected frame?: number | undefined;

    constructor(res: SpriteSheetConfig) {
        super(res);
        console.assert(!!res.img);
        this.img = res.img;
        this.sx = res.sx || 0;
        this.sy = res.sy || 0;
        this.sw = res.sw || res.img.width;
        this.sh = res.sh || res.img.height;
        this.angle = res.rotate && (res.rotate / 180 * Math.PI);
        this.mirror = res.mirror;
        const scale = this.getScale() / 100;
        this.frameCountX = Math.round(this.sw * scale / res.w);
        this.frameCountY = Math.round(this.sh * scale / res.h);
        this.frameCount = this.frameCountX * this.frameCountY;
        this.frameWidth = this.w;
        this.frameHeight = this.h;
        const useOriginalImage = !this.angle && !this.mirror && (scale == 1);
        this.canvas = (useOriginalImage && res.canvas) || this.createCanvas(res.cache);
        this.canvasOffsetX = (useOriginalImage && res.canvas && res.sx) || 0;
        this.canvasOffsetY = (useOriginalImage && res.canvas && res.sy) || 0;
        this.setFrame(res.frame || 0);
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
        this.ctx = this.canvas && this.canvas.getContext("2d");
    }

    onStageStopped(stage: Stage) {
        delete this.ctx;
    }

    setFrame(frame: number) {
        if (this.frame != frame) {
            this.frame = frame;
            if (frame >= 0) {
                const frameCountX = this.frameCountX;
                this.offsetX = (frame % frameCountX) * this.frameWidth;
                this.offsetY = Math.floor(frame / frameCountX) * this.frameHeight;
            }
            this.setDirty(true);
        }
    }

    getFrame(): number {
        return this.frame;
    }

    getFrameCount(): number {
        return this.frameCount;
    }

    protected getImageData(x: number, y: number): Uint8ClampedArray {
        return this.ctx.getImageData(
            this.canvasOffsetX + x - this.x + this.offsetX,
            this.canvasOffsetY + y - this.y + this.offsetY,
            1, 1).data;
    }

    drawRect(ctx: CanvasRenderingContext2D, src: Rect, dst: Rect) {
        super.drawRect(ctx, src, dst);
        if (this.frame < 0 || !this.canvas) {
            return;
        }
        Profiler.begin("draw");
        try {
            ctx.drawImage(
                this.canvas,
                this.canvasOffsetX + src.x + this.offsetX,
                this.canvasOffsetY + src.y + this.offsetY,
                src.w, src.h,
                dst.x, dst.y, dst.w, dst.h
            );
        } catch (e) {
            ErrorReporter.warn(`Failed to draw image: ${src}, ${dst}: ${e}`, "SpriteSheet");
        }
        Profiler.end("draw");
    }

    /**
     * @return New or cached canvas element.
     */
    protected createCanvas(caching: "none" | "auto" | "force" = "none"): HTMLCanvasElement {
        if (caching != "force") {
            if ((caching == "none") || (this.getScale() != 100) || this.angle || this.mirror) {
                return this.newCanvas();
            }
        }
        const cacheKey = this.img.src;
        let canvas = canvasCache[cacheKey];
        if (!canvas) {
            canvas = this.newCanvas();
            canvasCache[cacheKey] = canvas;
        }
        return canvas;
    }

    protected newCanvas(): HTMLCanvasElement {
        const scale = this.getScale() / 100;
        const canvas = Sprites.createCanvas(
            Math.floor(this.sw * scale),
            Math.floor(this.sh * scale));
        this.drawImageOnCanvas(canvas);
        return canvas;
    }

    private drawImageOnCanvas(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext("2d");
        if (this.mirror) {
            Sprites.mirror(this, ctx, this.mirror, this.getScale());
        } else if (this.getScale() != 100) {
            const scale = this.getScale() / 100;
            ctx.scale(scale, scale);
        }
        if (this.angle) {
            Sprites.rotate(this, ctx, this.angle);
        }
        try {
            ctx.drawImage(this.img,
                this.sx, this.sy, this.sw, this.sh,
                0, 0, this.sw, this.sh);
        } catch (e) {
            ErrorReporter.warn(`Failed to draw image ${this.img.originSrc || this.img.src}: ${e}`, "SpriteSheet");
        }
        Sprites.applyFilters(this, ctx, 0, 0, canvas.width, canvas.height);
    }

    toJSON(): any {
        return {
            ...super.toJSON(),
            img: this.img.originSrc || this.img.src,
            frame: this.frame,
            angle: this.angle,
            mirror: this.mirror
        };
    }
}