import {RenderObject, RenderObjectConfig} from "./RenderObject";
import {Profiler} from "@andy-lib/profiler";
import {AugmentedHTMLImageElement, ErrorReporter, ImageResourceConfig} from "@andy-lib/server-resources";

export type AlignType = "left" | "center" | "right";
export type VerticalAlignType = "top" | "middle" | "bottom";

export interface SpriteConfig extends RenderObjectConfig, ImageResourceConfig {
    align?: AlignType | undefined;
    valign?: VerticalAlignType | undefined;
}

/**
 * Responsible for drawing and animating sprites.
 */
export class Sprite extends RenderObject {
    private img: AugmentedHTMLImageElement;
    private preRenderedCanvas?: HTMLCanvasElement | undefined;
    private sx: number;
    private sy: number;
    private sw: number;
    private sh: number;
    private align?: AlignType | undefined;
    private valign?: VerticalAlignType | undefined;
    private aligned?: boolean | false;

    constructor(res: SpriteConfig) {
        super(res);
        console.assert(!!res.img);
        this.img = res.img;
        res.canvas && (this.preRenderedCanvas = res.canvas);
        this.sx = res.sx || 0;
        this.sy = res.sy || 0;
        this.sw = res.sw || res.img.width;
        this.sh = res.sh || res.img.height;
        if (res.valign || res.valign || (this.sw < this.w) || (this.sh < this.h)) {
            res.align && (this.align = res.align);
            res.valign && (this.valign = res.valign);
            this.aligned = true;
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        Profiler.begin("render");
        const img = this.preRenderedCanvas || this.img;
        if (!this.aligned) {
            try {
                ctx.drawImage(img,
                    this.sx, this.sy, this.sw, this.sh,
                    0, 0, this.sw, this.sh);
            } catch (e) {
                const image = <AugmentedHTMLImageElement>img;
                ErrorReporter.warn(`Failed to draw image ${image.originSrc || image.src}: ${e}`, "Sprite");
            }
            return;
        }
        let x = 0, y = 0;
        const s = this.getScale() / 100;
        const sw = this.sw, sh = this.sh;
        switch (this.align) {
            case "left":
            default:
                break;
            case "center":
                x = Math.floor((this.w - sw * s) / (2 * s));
                break;
            case "right":
                x = Math.floor(this.w - sw * s);
                break;
        }
        switch (this.valign) {
            case "top":
            default:
                break;
            case "middle":
                y = Math.floor((this.h - sh * s) / (2 * s));
                break;
            case "bottom":
                y = Math.floor(this.h - sh * s);
                break;
        }
        try {
            ctx.drawImage(img,
                this.sx, this.sy, sw, sh,
                x, y, sw, sh);
        } catch (e) {
            const image = <AugmentedHTMLImageElement>img;
            ErrorReporter.warn(`Failed to draw image ${image.originSrc || image.src}: ${e}`, "Sprite");
        }
        Profiler.end("render");
    }

    toJSON(): any {
        return {
            ...super.toJSON(),
            img: this.img.originSrc || this.img.src,
            align: this.align,
            valign: this.valign,
            aligned: this.aligned
        };
    }
}