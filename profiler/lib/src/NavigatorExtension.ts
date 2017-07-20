import {AbstractPropertyExtension, AbstractPropertyExtensionOptions} from "./AbstractPropertyExtension";

const DEFAULT_PROPS = [
    "vendor",
    "appName",
    "platform",
    "vendorSub",
    "language",
    "userAgent",
    "product",
    "appCodeName",
    "appVersion",
    "productSub"
];

export class NavigatorExtension extends AbstractPropertyExtension {

    constructor(options: AbstractPropertyExtensionOptions) {
        super("navigator", {props: DEFAULT_PROPS, ...options});
    }

    getTargetObject(): any {
        return navigator;
    }
}