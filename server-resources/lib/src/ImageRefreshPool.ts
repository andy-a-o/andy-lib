import {AugmentedHTMLImageElement} from "./ImageResource";

export class ImageRefreshPool {

    protected constructor() {
    }

    static add(image: HTMLImageElement, callback?: () => void) {
        ImageRefreshPool.importanceMap[ImageRefreshPool.src(image)] = 1;
        ImageRefreshPool.startRefreshing(image, callback);
    }

    static remove(image) {
        ImageRefreshPool.stopRefreshing(image);
        delete ImageRefreshPool.importanceMap[ImageRefreshPool.src(image)];
    }

    static setImportance(image: HTMLImageElement, importance: number) {
        ImageRefreshPool.importanceMap[ImageRefreshPool.src(image)] = importance;
        if (importance > 0) {
            ImageRefreshPool.startRefreshing(image);
        } else {
            ImageRefreshPool.stopRefreshing(image);
        }
    }

    static getImportance(image): number {
        return ImageRefreshPool.importanceMap[ImageRefreshPool.src(image)] || 0;
    }

    private static readonly ctx = createCanvas(1, 1).getContext("2d");
    private static importanceMap: { [src: string]: number } = {};
    private static imagePool: HTMLImageElement[] = [];
    private static nextIndex = 0;
    private static warnThreshold = 16;
    private static refreshInterval = 10;

    private static startRefreshing(image: HTMLImageElement, callback?: () => void) {
        const i = ImageRefreshPool.imagePool.indexOf(image);
        if (i < 0) {
            const wasEmpty = !ImageRefreshPool.imagePool.length;
            window.setTimeout(function () {
//            console.log(Date.now() + ": start refreshing " + src(image));
                const time = Date.now();
                ImageRefreshPool.ctx.drawImage(image, 0, 0, 1, 1);
//            console.log(Date.now() - time);
                ImageRefreshPool.imagePool.push(image);
                callback && callback();
                if (wasEmpty) {
                    ImageRefreshPool.refresh();
                }
            }, 0);
        }
    }

    private static stopRefreshing(image) {
        const i = ImageRefreshPool.imagePool.indexOf(image);
        if (i > 0) {
//        console.log(Date.now() + ": stop refreshing " + src(image));
            ImageRefreshPool.imagePool.splice(i, 1);
        }
    }

    private static refresh() {
        if (ImageRefreshPool.imagePool.length) {
            const image = ImageRefreshPool.imagePool[ImageRefreshPool.nextIndex++ % ImageRefreshPool.imagePool.length];
            const time = Date.now();
            ImageRefreshPool.ctx.drawImage(image, 0, 0, 1, 1);
            const timePassed = (Date.now() - time);
            if (timePassed > ImageRefreshPool.warnThreshold) {
                console.warn(`Refresh image ${ImageRefreshPool.src(image)} took ${(Date.now() - time)}ms`);
            }
            window.setTimeout(ImageRefreshPool.refresh, ImageRefreshPool.refreshInterval);
        }
    }

    private static src(image: AugmentedHTMLImageElement): string {
        return (image.originSrc || image.src);
    }
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    return c;
}