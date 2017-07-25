import {AbstractText, AbstractTextConfig} from "./AbstractText";
import {BitmapFontRegistry} from "./BitmapFontRegistry";
import {BitmapFont} from "./BitmapFont";

export interface BitmapTextConfig extends AbstractTextConfig {
    lsp?: number | undefined;
}

export class BitmapText extends AbstractText {
    private readonly font: BitmapFont;
    private readonly letterSpacing?: number | undefined;
    private readonly offsetCalcMethod: (line: string) => number;

    constructor(res: BitmapTextConfig) {
        super(res);
        console.assert(!!this.fontName);
        console.assert(!!this.fontSize);
        this.font = BitmapFontRegistry.get(this.fontName);
        this.fontScale = this.fontSize / this.font.getSize();
        this.letterSpacing = res.lsp;
        this.lineHeight = this.lineHeight || this.font.getLineHeight();
        switch (res.align) {
            case "left":
                this.offsetCalcMethod = this.getOffsetX_left.bind(this);
                break;
            default:
            case "center":
                this.offsetCalcMethod = this.getOffsetX_center.bind(this);
                break;
            case "right":
                this.offsetCalcMethod = this.getOffsetX_right.bind(this);
                break;
        }
    }

    measureTextWidth(text: string): number {
        return this.font.measureTextWidth(text, this.fontSize || this.h, this.letterSpacing);
    }

    protected getOffsetX(text: string): number {
        return this.offsetCalcMethod(text);
    }

    protected renderLine(line: string, ctx: CanvasRenderingContext2D, y: number) {
        const x = this.getOffsetX(line);
        this.font.drawText(line, ctx, x, Math.floor(y / this.fontScale), this.letterSpacing);
    }

    private getOffsetX_left(line: string): number {
        return Math.floor((this.paddingLeft || 0) / this.fontScale);
    }

    private getOffsetX_center(line: string): number {
        const width = this.measureTextWidth(line);
        return Math.floor(((this.w - width) / 2) / this.fontScale);
    }

    private getOffsetX_right(line: string): number {
        const width = this.measureTextWidth(line);
        return Math.floor((this.w - this.paddingRight - width) / this.fontScale);
    }
}