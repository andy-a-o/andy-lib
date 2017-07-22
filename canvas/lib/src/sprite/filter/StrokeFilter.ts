import {AbstractFilter} from "./AbstractFilter";
import {RGBColor} from "../../util/RGBColor";

export type StrokeStyle = "inner" | "outer";

export interface StrokeFilterConfig {
    style?: StrokeStyle | undefined;
    color?: string | undefined;
    width?: number | undefined;
    debug?: boolean | undefined;
}

/**
 * The algorithm is based on Euclidean Distance Transform,
 * which is used in Photoshop, as mentioned here:
 * http://dsp.stackexchange.com/questions/513/bitmap-border-stroke-alogirthm
 */
export class StrokeFilter extends AbstractFilter {
    private readonly style: "inner" | "outer";
    private readonly color: string;
    private readonly width: number;
    private readonly debug: boolean;

    constructor(config: StrokeFilterConfig) {
        super();
        this.style = config.style || "outer";
        this.color = config.color || "black";
        this.width = config.width || 1;
        this.debug = !!config.debug;
    }

    apply(imageData: ImageData): ImageData {
        let d;
        let idx;
        let y;
        let x;
        if (!StrokeFilter.isSupported()) {
            return imageData;
        }
        const time = Date.now();
        const outer = (this.style == "outer");
        const m = imageData.width;
        const n = imageData.height;
        const scale = 256;
        const inf = scale * (m + n);
        const radius = this.width;
        const radiusSquared = radius * radius * 65536;
        const radiusPlusOneSquared = (radius + 1) * (radius + 1) * 65536;
        const rgb = new RGBColor(this.color);
        const data = imageData.data;
        const g = new Int32Array(m * n);
        // "A General Algorithm for Computing Distance Transforms in Linear Time"
        // - A. Meijster, 2003
        // phase 1
        {
            for (x = 0; x < m; ++x) {
                let a = data[3 + x * 4];
                if (outer) {
                    a = 255 - a;
                }
                if (a == 0) {
                    g[x] = 0;
                } else if (a == 255) {
                    g[x] = inf;
                } else {
                    g[x] = a;
                }
                // scan 1
                for (y = 1; y < n; ++y) {
                    idx = x + y * m;
                    a = data[3 + idx * 4];
                    if (outer) {
                        a = 255 - a;
                    }
                    if (a == 0) {
                        g[idx] = 0;
                    } else if (a == 255) {
                        g[idx] = scale + g[idx - m];
                    } else {
                        g[idx] = a;
                    }
                }
                // scan 2
                for (y = n - 2; y >= 0; --y) {
                    idx = x + y * m;
                    d = scale + g[idx + m];
                    if (g[idx] > d) {
                        g[idx] = d;
                    }
                }
            }
        }
        // phase 2
        {
            const s = new Int32Array(Math.max(m, n));
            const t = new Int32Array(Math.max(m, n)); // scaled
            for (y = 0; y < n; ++y) {
                let i = m * (y + 1) * 4 - 4;
                let q = 0;
                s[0] = 0;
                t[0] = 0;
                const ym = y * m;
                // scan 3
                for (let u = 1; u < m; ++u) {
                    while (q >= 0) {
                        const tqf8 = (t[q] & 0xffffff00);
                        const f_x_i_0 = tqf8 - scale * s[q];
                        const f_gi_0 = g[s[q] + ym];
                        const f_x_i_1 = tqf8 - scale * u;
                        const f_gi_1 = g[u + ym];
                        const f_0 = (f_x_i_0 * f_x_i_0) + f_gi_0 * f_gi_0; // Euclidean distance squared
                        const f_1 = (f_x_i_1 * f_x_i_1) + f_gi_1 * f_gi_1; // Euclidean distance squared
                        if (f_0 <= f_1) {
                            break;
                        }
                        q--;
                    }
                    if (q < 0) {
                        q = 0;
                        s [0] = u;
                    } else {
                        const sep_i = scale * s[q];
                        const sep_u = scale * u;
                        const sep_gi = g[s[q] + ym];
                        const sep_gu = g[u + ym];
                        const w = scale + (((sep_u * sep_u - sep_i * sep_i + sep_gu * sep_gu - sep_gi * sep_gi) / (2 * (sep_u - sep_i))) | 0);
                        if (w < scale * m) {
                            ++q;
                            s[q] = u;
                            t[q] = w;
                        }
                    }
                }
                // scan 4
                for (x = m - 1; x >= 0; --x) {
                    const f_x_i = scale * (x - s[q]);
                    const f_gi = g[s[q] + ym];
                    d = (f_x_i * f_x_i) + f_gi * f_gi; // distance squared
                    //////////////
                    let alpha;
                    if (d <= 0 || d >= radiusPlusOneSquared) {
                        alpha = 0;
                    } else if (d < radiusSquared) {
                        alpha = 255;
                    } else {
                        const distance = Math.sqrt(d / 65536) - radius;
                        alpha = 255 - ((255 * distance + 0.5) | 0);
                    }
                    // Blend with stroke color
                    let mul = alpha * 257;
                    const red = (data[i] + ((mul * (rgb.r - data[i]) + 32769) >> 16));
                    const green = (data[i + 1] + ((mul * (rgb.g - data[i + 1]) + 32769) >> 16));
                    const blue = (data[i + 2] + ((mul * (rgb.b - data[i + 2]) + 32769) >> 16));
                    // Blend with original color (fill)
                    mul = data[i + 3] * 257;
                    data[i] = (red + ((mul * (data[i] - red) + 32769) >> 16));
                    data[i + 1] = (green + ((mul * (data[i + 1] - green) + 32769) >> 16));
                    data[i + 2] = (blue + ((mul * (data[i + 2] - blue) + 32769) >> 16));
                    data[i + 3] = alpha || data[i + 3];
                    i -= 4;
                    /////////////
                    if (x == ((t[q] / scale) | 0)) {
                        --q;
                    }
                }
            }
        }
        if (this.debug) {
            console.debug(`${Date.now() - time}`);
        }
        return imageData;
    }

    static isSupported(): boolean {
        return !!window["Int32Array"];
    }
}