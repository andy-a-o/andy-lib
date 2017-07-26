import {Rect} from "./Rect";
import {DisplayObject, DisplayObjectConfig} from "../sprite/DisplayObject";
import {Profiler} from "@andy-lib/profiler";
import {AugmentedHTMLImageElement, ErrorReporter} from "@andy-lib/server-resources";

export type MirrorType = "x" | "y" | "xy";

export abstract class HAlign {
    abstract getX(bounds: Rect, w: number): number;

    static readonly LEFT: HAlign = {
        getX(bounds: Rect, w: number): number {
            return bounds.x;
        }
    };

    static readonly CENTER: HAlign = {
        getX(bounds: Rect, w: number): number {
            return Math.floor(bounds.x + (bounds.w - w) / 2);
        }
    };

    static readonly RIGHT: HAlign = {
        getX(bounds: Rect, w: number) {
            return bounds.r - w;
        }
    };
}

export abstract class VAlign {
    abstract getY(bounds: Rect, h: number): number;

    static readonly TOP: VAlign = {
        getY(bounds: Rect, h: number): number {
            return bounds.y;
        }
    };

    static readonly MIDDLE: VAlign = {
        getY(bounds: Rect, h: number): number {
            return Math.floor(bounds.y + (bounds.h - h) / 2);
        }
    };

    static readonly BOTTOM: VAlign = {
        getY(bounds: Rect, h: number) {
            return bounds.b - h;
        }
    };
}

export class Sprites {

    protected constructor() {
    }

    static insertSpriteIntoZIndexOrderedArray(sprites: DisplayObject[], s: DisplayObject) {
        if (sprites.length > 0) {
            const z = s.z;
            let i = sprites.length - 1;
            while ((i >= 0) && (sprites[i].z > z)) {
                --i;
            }
            sprites.splice(i + 1, 0, s);
        } else {
            sprites.push(s);
        }
    }

    static addOffset<T extends DisplayObjectConfig>(res: T, parent: Rect): T {
        if (!res.offset) {
            return res;
        }
        const offset = res.offset || {};
        return {
            ...<any>res,
            x: offset.x !== undefined ? parent.x + offset.x : offset.r !== undefined ? parent.r - res.w - offset.r : res.x,
            y: offset.y !== undefined ? parent.y + offset.y : offset.b !== undefined ? parent.b - res.h - offset.b : res.y
        };
    }

    static embed(res: { w: number, h: number },
                 bounds: Rect,
                 scale: number,
                 ha: HAlign = HAlign.CENTER,
                 va: VAlign = VAlign.MIDDLE): { x: number, y: number, w: number, h: number, scale: number | undefined } {
        const maxw = bounds.w;
        const maxh = bounds.h;
        const s = Math.min(maxw / res.w, maxh / res.h);
        const scaling = s > 1 ? Sprites.SCALE_ENLARGE : Sprites.SCALE_SHRINK;
        const noscale = (((scale || Sprites.NOSCALE) & scaling) == 0);
        const w = noscale ? res.w : Math.floor(res.w * s);
        const h = noscale ? res.h : Math.floor(res.h * s);
        const x = ha.getX(bounds, w);
        const y = va.getY(bounds, h);
        return {...res, x: x, y: y, w: w, h: h, scale: (noscale ? undefined : s * 100)};
    }

    static adjust(rect: Rect, target: Rect) {
        const dx = Math.floor((target.w - rect.w) / 2);
        const dy = Math.floor((target.h - rect.h) / 2);
        rect.move(target.x + dx, target.y + dy);
    }

    static applyFilters(sprite: DisplayObject, ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
        Profiler.begin("filter");
        const filters = sprite.getFilters();
        if (filters.length > 0) {
            let imageData = ctx.getImageData(x, y, w, h);
            for (let i = 0, n = filters.length; i < n; ++i) {
                imageData = filters[i].apply(imageData);
            }
            ctx.putImageData(imageData, x, y);
        }
        Profiler.end("filter");
    }

    /**
     * @param sprite
     * @param ctx
     * @param angle Angle in radians
     */
    static rotate(sprite: DisplayObject, ctx: CanvasRenderingContext2D, angle: number) {
        const tx = (sprite.w / 2) || 0;
        const ty = (sprite.h / 2) || 0;
        ctx.translate(tx, ty);
        ctx.rotate(angle);
        ctx.translate(-tx, -ty);
    }

    static mirror(sprite: DisplayObject, ctx: CanvasRenderingContext2D, mirror: MirrorType, scale: number = 100) {
        scale = (scale || 100) / 100;
        const mirrorX = mirror.indexOf("x") >= 0;
        const mirrorY = mirror.indexOf("y") >= 0;
        ctx.translate(mirrorX ? sprite.w : 0, mirrorY ? sprite.h : 0);
        ctx.scale(mirrorX ? -scale : scale, mirrorY ? -scale : scale);
    }

    static createCanvas(width: number, height: number): HTMLCanvasElement {
        const c = document.createElement("canvas");
        c.width = width;
        c.height = height;
        return c;
    }

    static createCanvasForImage(img: AugmentedHTMLImageElement): HTMLCanvasElement {
        const c = this.createCanvas(img.width, img.height);
        try {
            const context = c.getContext("2d");
            context && context.drawImage(img, 0, 0);
        } catch (e) {
            ErrorReporter.warn(`Failed to draw image ${img.originSrc || img.src}: ${e}`, "Sprites");
        }
        return c;
    }

    /**
     * @see {Sprites#embed}
     */
    static readonly NOSCALE: number = 0;

    /**
     * @see {Sprites#embed}
     */
    static readonly SCALE_ENLARGE: number = 1;

    /**
     * @see {Sprites#embed}
     */
    static readonly SCALE_SHRINK: number = 2;

    /**
     * @see {Sprites#embed}
     */
    static readonly SCALE_ALL: number = Sprites.SCALE_ENLARGE | Sprites.SCALE_SHRINK;
}