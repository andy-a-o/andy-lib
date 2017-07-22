import {BitmapFont} from "./BitmapFont";

export class BitmapFontRegistry {

    protected constructor() {
    }

    static add(font: BitmapFont) {
        BitmapFontRegistry.fonts[font.getName()] = font;
    }

    static get(fontName: string): BitmapFont {
        const font = BitmapFontRegistry.find(fontName);
        console.assert(!!font, `Font ${fontName} not defined`);
        return font;
    }

    static find(fontName: string): BitmapFont | undefined {
        return BitmapFontRegistry.fonts[fontName];
    }

    private static readonly fonts: { [fontFace: string]: BitmapFont } = {};
}