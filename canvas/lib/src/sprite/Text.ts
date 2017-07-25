import {AbstractText, AbstractTextConfig} from "./AbstractText";
import {StrokeFilter, StrokeFilterConfig} from "./filter/StrokeFilter";
import {Browser} from "@andy-lib/util";

export type TextBaselineType = "alphabetic" | "top" | "hanging" | "middle" | "ideographic" | "bottom";

export type TextAlignType = "start" | "center" | "end";

export interface TextStrokeConfig extends StrokeFilterConfig {
    method?: "filter" | undefined;
}

export interface ShadowConfig {
    color: string;
    x: number;
    y: number;
    blur: number;
}

export interface TextConfig extends AbstractTextConfig {
    bold?: boolean | undefined;
    italic?: boolean | undefined;
    lh?: number | undefined;
    color?: string | undefined;
    stroke?: TextStrokeConfig | undefined;
    shadow?: ShadowConfig | undefined;
    underline?: number | undefined;
    baseline?: TextBaselineType | undefined;
}

export class Text extends AbstractText {
    private readonly font: string;
    private color: string;
    private readonly stroke?: TextStrokeConfig | undefined;
    private readonly shadow?: ShadowConfig | undefined;
    protected underline: number | undefined;
    private textBaseline: TextBaselineType | undefined;
    private readonly drawX: number;
    private readonly textAlign: TextAlignType;

    constructor(res: TextConfig) {
        super(res);
        const fontSize = this.fontSize || res.h;
        let font = "";
        if (res.italic) {
            font += "italic ";
        }
        if (res.bold) {
            font += "bold ";
        }
        font += `${fontSize} px `;
        font += (this.fontName || "Times New Roman");
        this.lineHeight = this.lineHeight || fontSize;
        this.font = font;
        this.color = res.color || "black";
        if (res.stroke) {
            if ((res.stroke.method == "filter") && StrokeFilter.isSupported()) {
                this.addFilter(new StrokeFilter(res.stroke));
            } else {
                // Fallback to strokeText.
                this.stroke = res.stroke;
            }
        }
        res.shadow && (this.shadow = res.shadow);
        res.underline && (this.underline = res.underline);
        res.baseline && (this.textBaseline = res.baseline);
        switch (res.align) {
            case "left":
                this.drawX = this.paddingLeft || 0;
                this.textAlign = "start";
                break;
            default:
            case "center":
                this.drawX = this.w / 2;
                this.textAlign = "center";
                break;
            case "right":
                this.drawX = this.w - (this.paddingRight || 0);
                this.textAlign = "end";
                break;
        }
    }

    setColor(color: string) {
        if (this.color != color) {
            this.color = color;
            this.setDirty(true);
        }
    }

    getColor(): string {
        return this.color;
    }

    setUnderline(underline: number) {
        if (this.underline != underline) {
            this.underline = underline;
            this.setDirty(true);
        }
    }

    getUnderline(): number {
        return this.underline;
    }

    protected wrapText(text: string, ctx: CanvasRenderingContext2D): string[] {
        this.applyTextSettings(ctx);
        return super.wrapText(text, ctx);
    }

    measureTextWidth(text: string, ctx: CanvasRenderingContext2D): number {
        return Math.ceil(ctx.measureText(text).width);
    }

    protected renderLine(line: string, ctx: CanvasRenderingContext2D, y: number) {
        this.applyTextSettings(ctx);
        y = applyBrowserHack(y, this.lineHeight);
        if (this.stroke) {
            ctx.strokeStyle = this.stroke.color;
            ctx.lineWidth = this.stroke.width * 2;
            ctx.strokeText(line, this.drawX, y);
        }
        ctx.fillText(line, this.drawX, y);
        if (this.underline) {
            const lineWidth = this.measureTextWidth(line, ctx);
            const underlineX = (this.textAlign == "start")
                ? 0
                : (this.textAlign == "center")
                    ? Math.floor((this.w - lineWidth) / 2)
                    : this.w - lineWidth;
            const underlineY = y + this.lineHeight + this.underline;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.underline;
            ctx.beginPath();
            ctx.moveTo(underlineX, underlineY);
            ctx.lineTo(underlineX + lineWidth, underlineY);
            ctx.stroke();
        }
    }

    protected applyTextSettings(ctx: CanvasRenderingContext2D) {
        ctx.textAlign = this.textAlign;
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.textBaseline = this.textBaseline || "top";
        if (this.shadow) {
            ctx.shadowColor = this.shadow.color;
            ctx.shadowOffsetX = this.shadow.x;
            ctx.shadowOffsetY = this.shadow.y;
            ctx.shadowBlur = this.shadow.blur;
        }
    }
}

const shift = Browser.mozilla ? 0.15 : 0;

function applyBrowserHack(y, lineHeight) {
    return y + Math.floor(lineHeight * shift);
}