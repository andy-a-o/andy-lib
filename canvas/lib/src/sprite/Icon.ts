import {RenderObject, RenderObjectConfig} from "./RenderObject";
import {Listeners} from "@andy-lib/util";
import {HAlign, Sprites, VAlign} from "../util/Sprites";
import {Profiler} from "@andy-lib/profiler";
import {ErrorReporter} from "@andy-lib/server-resources";
import {SpriteConfig} from "./Sprite";

export interface BorderConfig {
    color?: string | undefined;
    width?: number | undefined;
}

export interface IconConfig extends RenderObjectConfig, SpriteConfig {
    rotate?: number | undefined;
    border?: BorderConfig | undefined;
    iconscale?: "enlarge" | boolean | undefined;
}

export interface IconListener {
    onIconImageLoaded(icon: Icon);
}

/**
 * Icon is a sprite whose image can
 * be loaded later, from the given URL.
 * Note that the image is automatically
 * resized to fit the icon bounds.
 */
export class Icon extends RenderObject {
    private readonly iconListeners = new Listeners<IconListener>([
        "onIconImageLoaded"
    ]);

    private stroke?: boolean | undefined;
    private strokeStyle?: string | undefined;
    private strokeWidth?: number | undefined;
    private hAlign: HAlign;
    private vAlign: VAlign;
    private iconScaling: number;
    private loaded: boolean | undefined;
    private img: HTMLImageElement | undefined;
    private imageUrl: string | undefined;
    private imageres: { x: number, y: number, w: number, h: number, scale: number | undefined };

    constructor(res: IconConfig) {
        super(res);
        this.stroke = !!res.border;
        this.strokeStyle = res.border ? res.border.color : undefined;
        this.strokeWidth = res.border ? res.border.width : undefined;
        this.hAlign = res.align && HAlign[res.align.toUpperCase()];
        this.vAlign = res.valign && VAlign[res.valign.toUpperCase()];
        const scaling = res.iconscale;
        this.iconScaling = (scaling === true)
            ? Sprites.SCALE_ALL
            : (scaling === false)
                ? Sprites.NOSCALE
                : (scaling === "enlarge")
                    ? Sprites.SCALE_ENLARGE
                    : Sprites.SCALE_SHRINK;
    }

    setImageUrl(url: string | undefined) {
        this.loaded = false;
        if (url) {
            this.img = new Image();
            this.img.onload = () => {
                if (!this.img) {
                    return;
                }
                if (!this.img.complete) {
                    this.img.src = this.img.src;
                    return;
                }
                this.imageres = Sprites.embed({
                    w: this.img.width,
                    h: this.img.height
                }, this, this.iconScaling, this.hAlign, this.vAlign);
                this.loaded = true;
                this.imageUrl = url;
                this.setDirty(true);
                this.fireLoaded();
            };
            this.img.onerror = (e) => {
                ErrorReporter.warn(`Failed to load image from ${url}: ${e.message}`, "Icon");
            };
            this.img.src = url;
        } else {
            if (this.img) {
                delete this.img;
                this.imageUrl = url;
                this.setDirty(true);
            }
        }
    }

    getImageUrl(): string | undefined {
        return this.img ? this.img.src : undefined;
    }

    addIconListener(l: IconListener) {
        this.iconListeners.add(l);
    }

    removeIconListener(l: IconListener) {
        this.iconListeners.remove(l);
    }

    protected render(ctx: CanvasRenderingContext2D) {
        if (!this.loaded || !this.img) {
            return;
        }
        const r = this.imageres;
        const x = r.x - this.x;
        const y = r.y - this.y;
        Profiler.begin("render");
        const scale = (r.scale || 100) / 100;
        if (this.mirror) {
            Sprites.mirror(this, ctx, this.mirror, r.scale);
        } else if (scale != 1) {
            ctx.scale(scale, scale);
        }
        if (this.angle) {
            Sprites.rotate(this, ctx, this.angle);
        }
        const img = this.img;
        try {
            ctx.drawImage(img, Math.floor(x / scale), Math.floor(y / scale));
        } catch (e) {
            ErrorReporter.warn(`Failed to draw image ${img.src}: ${e}`, "Icon");
        }
        if (this.stroke) {
            this.strokeStyle && (ctx.strokeStyle = this.strokeStyle);
            this.strokeWidth && (ctx.lineWidth = this.strokeWidth);
            ctx.strokeRect(0, 0, Math.floor(this.w / scale), Math.floor(this.h / scale));
        }
        Profiler.end("render");
    }

    private fireLoaded() {
        this.iconListeners.call("onIconImageLoaded", [this]);
    }

    toJSON(): any {
        return {
            ...super.toJSON(),
            url: this.imageUrl,
            mirror: this.mirror,
            angle: this.angle,
            hAlign: this.hAlign,
            vAlign: this.vAlign
        };
    }
}