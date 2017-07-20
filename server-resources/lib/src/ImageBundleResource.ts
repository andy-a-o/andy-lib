import {AbstractBundleResource} from "./AbstractBundleResource";
import {ImageResourceConfig} from "./ImageResource";
import {BundleSpriteConfig, BundleConfig} from "./Bundle";

export interface ImageBundleSpriteConfig extends BundleSpriteConfig {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface ImageBundleConfig extends BundleConfig<ImageBundleSpriteConfig>, ImageResourceConfig {
}

export class ImageBundleResource extends AbstractBundleResource<ImageBundleConfig, ImageBundleSpriteConfig> {

    protected assignToResource(res: ImageResourceConfig, sprite: ImageBundleSpriteConfig, bundleResources: ImageBundleConfig[]) {
        const bundle = bundleResources[0];
        res.img = bundle.img;
        const canvas = bundle.canvas;
        if (canvas) {
            res.canvas = canvas;
        }
        res.sx = sprite.x;
        res.sy = sprite.y;
        res.sw = sprite.w;
        res.sh = sprite.h;
    }
}