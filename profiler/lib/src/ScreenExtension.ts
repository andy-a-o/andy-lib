import {AbstractPropertyExtension, AbstractPropertyExtensionOptions} from "./AbstractPropertyExtension";

const DEFAULT_PROPS = [
    "width",
    "height"
];

export class ScreenExtension extends AbstractPropertyExtension {

    constructor(options: AbstractPropertyExtensionOptions) {
        super("screen", {props: DEFAULT_PROPS, ...options});
    }

    getTargetObject(): any {
        return screen;
    }
}