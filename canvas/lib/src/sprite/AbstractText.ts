import {AlignType, RenderObject, RenderObjectConfig, VerticalAlignType} from "./RenderObject";
import {Template} from "../util/Template";
import {Strings} from "@andy-lib/util";
import {Profiler} from "@andy-lib/profiler";
import {Rect} from "../util/Rect";

export interface PaddingConfig {
    x: number;
    y: number;
    r: number;
    b: number;
}

export interface TextPaddingConfig {
    [symbol: string]: number;
}

export interface TextTransformConfig {
    transform?: string | undefined;
    lpad?: TextPaddingConfig;
    rpad?: TextPaddingConfig;
}

export interface LineConfig {
    height: number;
}

export interface FontConfig {
    name?: string | undefined;
    size?: number | undefined;
}

export interface AbstractTextConfig extends RenderObjectConfig, TextTransformConfig {
    font?: FontConfig | undefined;
    wrap?: boolean | undefined;
    template?: string | undefined;
    padding?: PaddingConfig | number | undefined;
    params?: { [key: string]: TextTransformConfig } | undefined;
    va?: VerticalAlignType | undefined;
    valign?: VerticalAlignType | undefined;
    rect?: boolean | undefined;
    text?: string | undefined;
    line?: LineConfig | undefined;
    lh?: number | undefined;
    align?: AlignType | undefined;
}

export abstract class AbstractText extends RenderObject {
    private wrap?: boolean | undefined;
    private template: Template | undefined;
    private readonly transformer: TextTransformer | undefined;
    private readonly paramTransformers: { [paramName: string]: TextTransformer } | undefined;
    private readonly verticalAlign: VerticalAlignType | undefined;
    private readonly drawBounds: boolean | undefined;
    private templateParams: {} | undefined;
    private text: string | undefined;
    private linesToDraw: string[] | undefined;

    protected readonly fontName?: string | undefined;
    protected readonly fontSize?: number | undefined;

    protected readonly paddingLeft: number | undefined;
    protected readonly paddingTop: number | undefined;
    protected readonly paddingRight: number | undefined;
    protected readonly paddingBottom: number | undefined;

    protected fontScale: number | undefined;
    protected lineHeight: number | undefined;

    constructor(res: AbstractTextConfig) {
        super(res);
        res.font && (this.fontName = res.font.name);
        res.font && (this.fontSize = res.font.size);
        res.wrap && (this.wrap = true);
        const transformer = createTransformer(res);
        transformer && (this.transformer = transformer);
        res.params && (this.paramTransformers = createParamTransformers(res.params));
        res.template && (this.template = new Template(res.template));
        if (typeof res.padding == "object") {
            this.paddingLeft = res.padding.x || 0;
            this.paddingTop = res.padding.y || 0;
            this.paddingRight = res.padding.r || 0;
            this.paddingBottom = res.padding.b || 0;
        } else if (res.padding) {
            this.paddingLeft = res.padding;
            this.paddingTop = res.padding;
            this.paddingRight = res.padding;
            this.paddingBottom = res.padding;
        }
        res.rect && (this.drawBounds = true);
        res.text && this.setText(res.text);
        (res.va || res.valign) && (this.verticalAlign = res.va || res.valign);
        (res.lh || res.line) && (this.lineHeight = res.lh || (res.line && res.line.height));
    }

    interpolate(params: any) {
        if (!this.template) {
            return;
        }
        if (this.paramTransformers) {
            params = this.transformParams(params);
        }
        this.templateParams = params;
        this.setText(this.template.interpolate(params));
    }

    getTipParams(): any | undefined {
        return this.templateParams;
    }

    setText(text: string) {
        if (this.text != text) {
            this.text = text;
            delete this.linesToDraw;
            this.setDirty(true);
        }
    }

    clearText() {
        if (this.text) {
            delete this.text;
            delete this.linesToDraw;
            this.setDirty(true);
        }
    }

    getText(): string {
        return this.text;
    }

    setTemplate(template: string) {
        if (this.template) {
            this.template.setTemplate(template);
        } else {
            this.template = new Template(template);
        }
    }

    getTemplate(): string {
        return this.template.getTemplate();
    }

    protected render(ctx: CanvasRenderingContext2D) {
        if (!this.text) {
            return;
        }
        Profiler.begin("render");
        if (this.drawBounds) {
            ctx.strokeRect(0, 0, this.w, this.h);
        }
        if (this.fontScale && (this.fontScale !== 1)) {
            ctx.scale(this.fontScale, this.fontScale);
        }
        const lines = this.getLinesToDraw(ctx);
        const lineHeight = this.lineHeight;
        const top = this.getTopCoord(lineHeight * lines.length);
        for (let i = 0, n = lines.length, y = top, dy = this.getLineOffset(); i < n; ++i, y += dy) {
            this.renderLine(lines[i], ctx, y);
        }
        Profiler.end("render");
    }

    protected getLinesToDraw(ctx: CanvasRenderingContext2D): string[] {
        if (this.linesToDraw) {
            return this.linesToDraw;
        }
        let text = this.transformer ?
            this.transformText(this.text)
            : this.text;
        if (!text) {
            text = "";
        }
        this.linesToDraw = this.wrap
            ? this.wrapText(text, ctx)
            : text.split("\n");
        return this.linesToDraw;
    }

    getTopCoord(textHeight: number): number {
        switch (this.verticalAlign) {
            case "middle":
                return Math.floor((this.h - textHeight) / 2);
            case "bottom":
                return this.h - textHeight - (this.paddingBottom || 0);
            case "top":
            default:
                return this.paddingTop || 0;
        }
    }

    protected getLineOffset(): number {
        return this.lineHeight;
    }

    adjustSizeToText() {
        const bounds = this.calculateBounds();
        if ((bounds.w !== this.w) || (bounds.h !== this.h)) {
            this.resize(bounds.w, bounds.h);
        }
    }

    calculateBounds(): Rect {
        const text = this.text;
        if (!text) {
            return null;
        }
        const ctx = this.getRenderContext();
        if (!ctx) {
            return null;
        }
        ctx.save();
        this.applyTextSettings(ctx);
        const lines = this.getLinesToDraw(ctx);
        let maxw = 0;
        for (let i = 0, n = lines.length; i < n; ++i) {
            const line = lines[i];
            const w = this.measureTextWidth(line, ctx);
            if (w > maxw) {
                maxw = w;
            }
        }
        const h = lines.length * (this.lineHeight || 0);
        ctx.restore();
        return new Rect(this.x, this.y, maxw, h);
    }

    protected applyTextSettings(ctx: CanvasRenderingContext2D) {
        // Stub
    }

    protected transformText(text: string): string {
        return this.transformer &&
            this.transformer.transform(text);
    }

    protected transformParams(params: { [paramName: string]: any }): { [paramName: string]: string } {
        if (!this.paramTransformers) {
            return params;
        }
        const transformerMap = this.paramTransformers;
        for (let key in params) {
            if (params.hasOwnProperty(key)) {
                const t = transformerMap[key];
                if (t) {
                    params[key] = t.transform("" + params[key]);
                }
            }
        }
        return params;
    }

    protected wrapText(text: string, ctx: CanvasRenderingContext2D): string[] {
        const lines = [];
        const maxWidth = this.w - (this.paddingLeft || 0) - (this.paddingRight || 0);
        const words = text.split(" ");
        let line = "";
        for (let i = 0, n = words.length; i < n; ++i) {
            const testLine = line ? (line + " " + words[i]) : words[i];
            const testWidth = this.measureTextWidth(testLine, ctx);
            if ((testWidth > maxWidth) && (i > 0)) {
                lines.push(line);
                line = words[i];
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        return lines;
    }

    protected abstract renderLine(line: string, ctx: CanvasRenderingContext2D, y: number);

    abstract measureTextWidth(text: string, ctx: CanvasRenderingContext2D): number;

    toJSON(): any {
        return {
            ...super.toJSON(),
            text: this.text
        };
    }
}

function getPadSymbol(res: TextPaddingConfig): string {
    for (let key in res) {
        if (res.hasOwnProperty(key)) {
            return key;
        }
    }
    throw new Error("pad symbol not specified");
}

interface TextTransformer {
    transform(text: string): string;
}

const UPPERCASE_TRANSFORMER: TextTransformer = {
    transform(text: string): string {
        return text && text.toUpperCase();
    }
};

const LOWERCASE_TRANSFORMER: TextTransformer = {
    transform(text: string): string {
        return text && text.toLowerCase();
    }
};

class LeftPadTransformer implements TextTransformer {
    private readonly symbol: string;
    private readonly length: number;

    constructor(res: TextPaddingConfig) {
        this.symbol = getPadSymbol(res);
        this.length = res[this.symbol];
    }

    transform(text: string): string {
        return text && Strings.padLeft(text, this.symbol, this.length);
    }
}

class RightPadTransformer implements TextTransformer {
    private readonly symbol: string;
    private readonly length: number;

    constructor(res: TextPaddingConfig) {
        this.symbol = getPadSymbol(res);
        this.length = res[this.symbol];
    }

    transform(text: string): string {
        return text && Strings.padRight(text, this.symbol, this.length);
    }
}

class CompositeTransformer {

    constructor(private transformers: TextTransformer[]) {
    }

    transform(text: string): string {
        if (text) {
            const transformers = this.transformers;
            for (let i = 0, n = transformers.length; i < n; ++i) {
                text = transformers[i].transform(text);
            }
        }
        return text;
    }
}

function createParamTransformers(res: { [key: string]: TextTransformConfig }): { [paramName: string]: TextTransformer } {
    const transformerMap = {};
    for (let key in res) {
        if (res.hasOwnProperty(key)) {
            transformerMap[key] = createTransformer(res[key]);
        }
    }
    return transformerMap;
}

function createTransformer(res: TextTransformConfig) {
    const transformers = [];
    switch (res.transform) {
        case "upper":
            transformers.push(UPPERCASE_TRANSFORMER);
            break;
        case "lower":
            transformers.push(LOWERCASE_TRANSFORMER);
            break;
    }
    if (res.lpad) {
        transformers.push(new LeftPadTransformer(res.lpad));
    } else if (res.rpad) {
        transformers.push(new RightPadTransformer(res.rpad));
    }
    switch (transformers.length) {
        case 0:
            return undefined;
        case 1:
            return transformers[0];
        default:
            return new CompositeTransformer(transformers);
    }
}