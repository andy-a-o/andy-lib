import {Sprites} from "../util/Sprites";

export interface CharConfig {
    id: number;
    x: number;
    y: number;
    w: number;
    h: number;
    sx: number;
    sy: number;
    xadv: number;
}

export interface BitmapFontConfig {
    info: { name: string, size: number };
    common?: { lineHeight?: number, "case": string } | undefined;
    canvas?: HTMLCanvasElement | undefined;
    img?: HTMLImageElement | undefined;
    chars: CharConfig[];
}

export class BitmapFont {
    private readonly canvas: HTMLCanvasElement;
    private readonly name: string;
    private readonly size: number;
    private readonly lineHeight: number;
    private readonly textCase: string;
    private readonly chars: { [id: number]: CharConfig } = {};

    constructor(res: BitmapFontConfig) {
        this.canvas = res.canvas || Sprites.createCanvasForImage(res.img);
        this.name = res.info.name;
        this.size = res.info.size;
        this.lineHeight = res.common && res.common.lineHeight || this.size;
        this.textCase = res.common && res.common["case"];
        const arr = res.chars;
        for (let i = 0, n = arr.length; i < n; ++i) {
            this.chars[arr[i].id] = arr[i];
        }
    }

    getName(): string {
        return this.name;
    }

    getSize(): number {
        return this.size;
    }

    getLineHeight(): number {
        return this.lineHeight;
    }

    /**
     * @return Next x-coord
     */
    drawChar(charCode: number, ctx: CanvasRenderingContext2D, x: number, y: number): number {
        let charData = this.chars[charCode];
        if (!charData) {
            console.warn(`${this.name}: no data for char "${String.fromCharCode(charCode)}"`);
            return x;
        }
        if (charData.w && charData.h) {
            ctx.drawImage(
                this.canvas,
                charData.x,
                charData.y,
                charData.w,
                charData.h,
                x + charData.sx,
                y + charData.sy,
                charData.w,
                charData.h);
        }
        return x + charData.xadv;
    }

    /**
     * @return Next x-coord
     */
    drawText(text: string, ctx: CanvasRenderingContext2D, x: number, y: number, letterSpacing: number = 0): number {
        text = this.transformText(text);
        for (let i = 0, n = text.length; i < n; ++i) {
            const charCode = text.charCodeAt(i);
            x = this.drawChar(charCode, ctx, x, y);
            if (i < n - 1) {
                x += letterSpacing;
            }
        }
        return x;
    }

    measureTextWidth(text: string, size: number, letterSpacing: number = 0): number {
        text = this.transformText(text);
        const scale = size / this.size;
        const data = this.chars;
        let x = 0;
        for (let i = 0, n = text.length; i < n; ++i) {
            const charCode = text.charCodeAt(i);
            let charData = data[charCode];
            if (!charData) {
                continue;
            }
            x += charData.xadv;
            if (i < n - 1) {
                x += letterSpacing;
            }
        }
        return Math.floor(x * scale);
    }

    private transformText(text: string): string {
        if (this.textCase == "upper") {
            return text.toUpperCase();
        } else if (this.textCase == "lower") {
            return text.toLowerCase();
        }
        return text;
    }
}