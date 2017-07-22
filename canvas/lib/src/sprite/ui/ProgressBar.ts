import {AbstractShape, ShapeConfig} from "../shape/AbstractShape";
import {Profiler} from "@andy-lib/profiler";
import {DisplayObject} from "../DisplayObject";
import {AugmentedHTMLImageElement, ErrorReporter, ImageResourceConfig} from "@andy-lib/server-resources";

export interface BaseImageConfig extends ImageResourceConfig {
    w?: number | undefined;
    h?: number | undefined;
}

export interface BackgroundConfig extends BaseImageConfig {
    offset?: { x?: number | undefined, y?: number | undefined } | undefined;
}

export interface ImageProgressConfig extends BackgroundConfig {
}

export interface ProgressMarkConfig extends BaseImageConfig {
    tx?: number | undefined;
    ty?: number | undefined;
    /**
     * Start angle, in degrees.
     */
    start?: number | undefined;
}

export interface CircleImageProgressConfig extends BackgroundConfig {
    radius?: number | undefined;
    cx?: number | undefined;
    cy?: number | undefined;
    mark?: ProgressMarkConfig | undefined;
}

export interface ProgressConfig extends ImageProgressConfig, CircleImageProgressConfig {
    img?: HTMLImageElement | undefined;
    shape?: string | undefined;
    color?: string | undefined;
}

export interface ProgressBarConfig extends ShapeConfig {
    vertical?: boolean | undefined;
    progress?: ProgressConfig | undefined;
    background?: BackgroundConfig | undefined;
}

export class ProgressBar extends AbstractShape {
    private readonly background?: Background | undefined;
    private readonly progressRenderer?: ProgressRenderer | undefined;
    private readonly vertical?: boolean | undefined;
    private progressColor?: string | undefined;
    private progress?: number | undefined;
    private total?: number | undefined;

    constructor(res: ProgressBarConfig) {
        super(res);
        res.vertical && (this.vertical = res.vertical);
        this.progressColor = res.progress && res.progress.color;
        if (res.progress && res.progress.img) {
            switch (res.progress.shape) {
                case "circle":
                    this.progressRenderer = new CircleImageProgress(res.progress, this);
                    break;
                default:
                    this.progressRenderer = new ImageProgress(res.progress, this);
                    break;
            }
        } else {
            this.progressRenderer = new RectangleProgress(res.w, res.h);
        }
        if (res.background) {
            this.background = new Background(res.background, this);
        }
    }

    getTipParams(): any {
        return {
            progress: this.progress,
            total: this.total,
            percent: Math.floor((this.progress / this.total) * 100)
        };
    }

    setProgressColor(color: string) {
        if (this.progressColor != color) {
            this.progressColor = color;
            this.setDirty(true);
        }
    }

    getProgressColor(): string {
        return this.progressColor;
    }

    initProgress(total: number) {
        this.total = total;
        this.progress = 0;
        this.setDirty(true);
    }

    updateProgress(progress: number) {
        if (this.progress != progress) {
            this.progress = progress;
            this.setDirty(true);
        }
    }

    renderShape(ctx: CanvasRenderingContext2D, stroke: boolean, fill: boolean) {
        Profiler.begin("render");
        if (fill) {
            ctx.fillRect(0, 0, this.w, this.h);
        }
        const background = this.background;
        if (background) {
            background.draw(ctx);
        }
        const percent = (this.progress / this.total);
        const renderer = this.progressRenderer;
        const progressColor = this.progressColor;
        if (this.vertical) {
            renderer.drawVertical(ctx, percent, progressColor);
        } else {
            renderer.drawHorizontal(ctx, percent, progressColor);
        }
        if (stroke) {
            ctx.strokeRect(0, 0, this.w, this.h);
        }
        Profiler.end("render");
    }
}

class Background {
    private readonly offsetX: number;
    private readonly offsetY: number;
    private readonly img: HTMLCanvasElement | HTMLImageElement;
    private readonly sx: number;
    private readonly sy: number;
    private readonly sw: number;
    private readonly sh: number;

    constructor(res: BackgroundConfig, sprite: DisplayObject) {
        this.offsetX = (res.offset && res.offset.x) || 0;
        this.offsetY = (res.offset && res.offset.y) || 0;
        this.img = res.canvas || res.img;
        this.sx = res.sx || 0;
        this.sy = res.sy || 0;
        this.sw = res.sw || res.w || sprite.w;
        this.sh = res.sh || res.h || sprite.h;
    }

    draw(ctx: CanvasRenderingContext2D) {
        try {
            ctx.drawImage(this.img,
                this.sx, this.sy, this.sw, this.sh,
                this.offsetX, this.offsetY, this.sw, this.sh);
        } catch (e) {
            reportDrawError(<AugmentedHTMLImageElement>this.img, e.toString())
        }
    }
}

interface ProgressRenderer {
    drawHorizontal(ctx: CanvasRenderingContext2D, progress: number, progressColor: string);

    drawVertical(ctx: CanvasRenderingContext2D, progress: number, progressColor: string);
}

class ImageProgress implements ProgressRenderer {
    private readonly offsetX: number;
    private readonly offsetY: number;
    private readonly img: HTMLCanvasElement | HTMLImageElement;
    private readonly sx: number;
    private readonly sy: number;
    private readonly sw: number;
    private readonly sh: number;
    private readonly sb: number;

    constructor(res: ImageProgressConfig, sprite: DisplayObject) {
        this.offsetX = (res.offset && res.offset.x) || 0;
        this.offsetY = (res.offset && res.offset.y) || 0;
        this.img = res.canvas || res.img;
        this.sx = res.sx || 0;
        this.sy = res.sy || 0;
        this.sw = res.sw || res.w || sprite.w;
        this.sh = res.sh || res.h || sprite.h;
        this.sb = this.sy + this.sh;
    }

    drawHorizontal(ctx: CanvasRenderingContext2D, progress: number, progressColor: string) {
        if (progress <= 0) {
            return;
        }
        const w = Math.floor(this.sw * progress), h = this.sh;
        if (w > 0) {
            try {
                ctx.drawImage(this.img, this.sx, this.sy, w, h, this.offsetX, this.offsetY, w, h);
            } catch (e) {
                reportDrawError(<AugmentedHTMLImageElement>this.img, `${e} (${[progress, this.sx, this.sy, w, h, this.offsetX, this.offsetY, w, h]})`);
            }
        }
    }

    drawVertical(ctx: CanvasRenderingContext2D, progress: number, progressColor: string) {
        if (progress <= 0) {
            return;
        }
        const w = this.sw, h = Math.floor(this.sh * progress);
        if (h > 0) {
            try {
                ctx.drawImage(this.img, this.sx, this.sb - h, w, h, this.offsetX, this.offsetY + this.sh - h, w, h);
            } catch (e) {
                reportDrawError(<AugmentedHTMLImageElement>this.img, `${e} (${[progress, this.sx, this.sb - h, w, h, this.offsetX, this.offsetY + this.sh - h, w, h]})`);
            }
        }
    }
}

class CircleImageProgress implements ProgressRenderer {
    private readonly offsetX: number;
    private readonly offsetY: number;
    private readonly img: HTMLCanvasElement | HTMLImageElement;
    private readonly sx: number;
    private readonly sy: number;
    private readonly sw: number;
    private readonly sh: number;
    private readonly cx: number;
    private readonly cy: number;
    private readonly radius: number;

    private readonly markImg?: HTMLCanvasElement | HTMLImageElement | undefined;
    private readonly markSx?: number | undefined;
    private readonly markSy?: number | undefined;
    private readonly markSw?: number | undefined;
    private readonly markSh?: number | undefined;
    private readonly markTx?: number | undefined;
    private readonly markTy?: number | undefined;
    private readonly markStartAngle?: number | undefined;

    constructor(res: CircleImageProgressConfig, sprite) {
        this.offsetX = (res.offset && res.offset.x) || 0;
        this.offsetY = (res.offset && res.offset.y) || 0;
        this.img = res.canvas || res.img;
        this.sx = res.sx || 0;
        this.sy = res.sy || 0;
        this.sw = res.sw || res.w || sprite.w;
        this.sh = res.sh || res.h || sprite.h;
        this.cx = res.cx || this.offsetX + Math.floor(this.sw / 2);
        this.cy = res.cy || this.offsetY + Math.floor(this.sh / 2);
        this.radius = res.radius || Math.max(res.cx || Math.floor(this.sw / 2), res.cy || Math.floor(this.sh / 2));
        if (res.mark) {
            this.markImg = res.mark.canvas || res.mark.img;
            this.markSx = res.mark.sx || 0;
            this.markSy = res.mark.sy || 0;
            this.markSw = res.mark.sw || res.mark.w;
            this.markSh = res.mark.sh || res.mark.h;
            this.markTx = res.mark.tx || 0;
            this.markTy = res.mark.ty || 0;
            this.markStartAngle = (res.mark.start || 0) * Math.PI / 180;
        }
    }

    drawHorizontal(ctx: CanvasRenderingContext2D, progress: number, progressColor: string) {
        this.draw(ctx, progress);
    }

    drawVertical(ctx: CanvasRenderingContext2D, progress: number, progressColor: string) {
        this.draw(ctx, progress);
    }

    private draw(ctx: CanvasRenderingContext2D, progress: number) {
        if (progress > 0) {
            try {
                ctx.drawImage(this.img, this.sx, this.sy, this.sw, this.sh, this.offsetX, this.offsetY, this.sw, this.sh);
            } catch (e) {
                reportDrawError(<AugmentedHTMLImageElement>this.img, `${e} (${[progress, this.sx, this.sy, this.sw, this.sh, this.offsetX, this.offsetY, this.sw, this.sh]})`);
            }
        }
        // Render circle mask above
        const radius = this.radius;
        const x = this.cx;
        const y = this.cy;
        const endAngle = -Math.PI / 2;
        const startAngle = endAngle + (Math.PI * 2) * progress;
        ctx.fillStyle = "black";
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, startAngle, endAngle, false);
        ctx.moveTo(x, y);
        ctx.closePath();
        ctx.fill();
        // Render mark
        if (this.markImg) {
            const angle = (startAngle - endAngle);
            const dx = radius * Math.sin(angle);
            const dy = radius * Math.cos(angle);
            const mx = Math.floor(this.cx + dx);
            const my = Math.floor(this.cy - dy);
            ctx.translate(mx, my);
            ctx.rotate(this.markStartAngle + angle);
            ctx.globalCompositeOperation = "source-over";
            try {
                ctx.drawImage(this.markImg, this.markSx, this.markSy, this.markSw, this.markSh,
                    this.markTx, this.markTy, this.markSw, this.markSh);
            } catch (e) {
                reportDrawError(<AugmentedHTMLImageElement>this.img, `${e} (${[this.markSx, this.markSy, this.markSw, this.markSh,
                    this.markTx, this.markTy, this.markSw, this.markSh]})"`);
            }
            ctx.translate(-mx, -mx);
        }
    }
}

class RectangleProgress implements ProgressRenderer {
    constructor(private w: number, private h: number) {
    }

    drawHorizontal(ctx: CanvasRenderingContext2D, progress: number, progressColor: string) {
        if (progress <= 0) {
            return;
        }
        const w = Math.floor(this.w * progress), h = this.h;
        ctx.fillStyle = progressColor;
        ctx.fillRect(0, 0, w, h);
    }

    drawVertical(ctx: CanvasRenderingContext2D, progress: number, progressColor: string) {
        if (progress <= 0) {
            return;
        }
        const w = this.w, h = Math.floor(this.h * progress);
        ctx.fillStyle = progressColor;
        ctx.fillRect(0, this.h - h, w, h);
    }
}

function reportDrawError(img: AugmentedHTMLImageElement, e: string) {
    ErrorReporter.warn(
        `Failed to draw image ${img.originSrc || img.src}: ${e}`,
        "ProgressBar");
}