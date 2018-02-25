import {BitmapText, BitmapTextConfig} from "./BitmapText";
import {Text, TextConfig} from "./Text";
import {AbstractText, AbstractTextConfig} from "./AbstractText";
import {BitmapFontRegistry} from "./BitmapFontRegistry";

export class TextFactory {

    protected constructor() {
    }

    static create(res: BitmapTextConfig | TextConfig): AbstractText {
        if (res.font && res.font && BitmapFontRegistry.find(res.font.name)) {
            return new BitmapText(<BitmapTextConfig>res);
        }
        return new Text(<TextConfig>res);
    }
}