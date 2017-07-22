import {AbstractFilter} from "./AbstractFilter";
import {Sprites} from "../../util/Sprites";

export interface ConvolutionConfig {
    opaque?: boolean | undefined;
    debug?: boolean | undefined;
}

export abstract class Convolution extends AbstractFilter {
    private readonly opaque: boolean;
    private readonly debug: boolean;

    constructor(config: ConvolutionConfig) {
        super();
        this.opaque = !!config.opaque;
        this.debug = !!config.debug;
    }

    protected abstract getKernelMatrix(): number[];

    apply(pixels: ImageData): ImageData {
        const time = Date.now();
        const weights = this.getKernelMatrix();
        const side = Math.round(Math.sqrt(weights.length));
        const halfSide = Math.floor(side / 2);
        const src = pixels.data;
        const sw = pixels.width;
        const sh = pixels.height;
        // pad output by the convolution matrix
        const output = createImageData(sw, sh);
        const dst = output.data;
        // go through the destination image pixels
        const alphaFac = this.opaque ? 1 : 0;
        for (let y = 0; y < sh; y++) {
            for (let x = 0; x < sw; x++) {
                const sy = y;
                const sx = x;
                const dstOff = (y * sw + x) * 4;
                // calculate the weighed sum of the source image pixels that
                // fall under the convolution matrix
                let r = 0, g = 0, b = 0, a = 0;
                for (let cy = 0; cy < side; cy++) {
                    for (let cx = 0; cx < side; cx++) {
                        const scy = sy + cy - halfSide;
                        const scx = sx + cx - halfSide;
                        if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                            const srcOff = (scy * sw + scx) * 4;
                            const wt = weights[cy * side + cx];
                            r += src[srcOff] * wt;
                            g += src[srcOff + 1] * wt;
                            b += src[srcOff + 2] * wt;
                            a += src[srcOff + 3] * wt;
                        }
                    }
                }
                dst[dstOff] = r;
                dst[dstOff + 1] = g;
                dst[dstOff + 2] = b;
                dst[dstOff + 3] = a + alphaFac * (255 - a);
            }
        }
        if (this.debug) {
            console.debug(`${Date.now() - time}`);
        }
        return output;
    }
}

function createImageData(w: number, h: number): ImageData {
    const canvas = Sprites.createCanvas(w, h);
    const ctx = canvas.getContext("2d");
    return ctx.createImageData(w, h);
}