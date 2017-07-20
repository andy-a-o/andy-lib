import {Resource, ResourceConfig} from "./Resource";
import {ImageRefreshPool} from "./ImageRefreshPool";
import {ErrorReporter} from './ErrorReporter';

export interface AugmentedHTMLImageElement extends HTMLImageElement {
    originSrc?: string | undefined;
}

export interface ImageResourceConfig extends ResourceConfig {
    img?: AugmentedHTMLImageElement | undefined;
    canvas?: HTMLCanvasElement | undefined;
    init?: "refresh" | "render" | undefined;
    sx?: number | undefined;
    sy?: number | undefined;
    sw?: number | undefined;
    sh?: number | undefined;
}

export class ImageResource extends Resource {
    private readonly image: AugmentedHTMLImageElement;
    private initialized: boolean = false;
    private initType?: "refresh" | "render" | undefined;
    private canvas?: HTMLCanvasElement | undefined;
    private resources?: ImageResourceConfig[] | undefined;

    constructor(res: ImageResourceConfig) {
        super(res);
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
            if (!image.complete) {
                // Mozilla bug workaround, see https://bugzilla.mozilla.org/show_bug.cgi?id=574330#c54
                image.src = image.src;
                return;
            }
            this.imageLoaded();
        };
        image.onerror = (e) => {
            this.fireError(e);
        };
        this.image = image;
        this.image.originSrc = res.src;
        res.init && (this.initType = res.init);
        this.initialized = !this.initType;
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    initialize() {
        switch (this.initType) {
            case "refresh":
                ImageRefreshPool.add(this.image, () => {
                    this.fireInitialized();
                });
                break;
            case "render":
                window.setTimeout(() => {
                    this.render();
                    this.fireInitialized();
                }, 0);
                break;
            default:
                throw new Error(`${this.initType} init type not supported`);
        }
    }

    assign(res: ImageResourceConfig) {
        res.img = this.image;
        if (this.initType) {
            if (!this.initialized) {
                if (!this.resources) {
                    this.resources = [];
                }
                this.resources.push(res);
                return;
            } else {
                res.canvas = this.canvas;
            }
        }
    }

    protected loadFromUrl(url: string) {
        this.image.src = url;
        this.fireLoadStarted();
    }

    protected imageLoaded() {
        this.fireLoaded();
    }

    private render() {
        console.assert(this.isLoaded());
        const image = this.image;
        this.canvas = createCanvasForImage(image);
        const resources = this.resources;
        if (resources) {
            for (let i = 0, n = resources.length; i < n; ++i) {
                resources[i].canvas = this.canvas;
            }
        }
        this.initialized = true;
    }
}

function createCanvasForImage(img: AugmentedHTMLImageElement): HTMLCanvasElement {
    const c = this.createCanvas(img.width, img.height);
    try {
        const context = c.getContext("2d");
        context && context.drawImage(img, 0, 0);
    } catch (e) {
        ErrorReporter.warn(`Failed to draw image ${img.originSrc || img.src}: ${e}`, "ImageResource");
    }
    return c;
}