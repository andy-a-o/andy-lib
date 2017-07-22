import {AbstractFilter} from "./AbstractFilter";

export class GrayscaleFilter extends AbstractFilter {

    apply(data: ImageData): ImageData {
        const pix = data.data;
        for (let i = 0, n = pix.length; i < n; i += 4) {
            const gs = pix[i] * .3 + pix[i + 1] * .59 + pix[i + 2] * .11;
            pix[i] = gs; 	// red
            pix[i + 1] = gs; 	// green
            pix[i + 2] = gs; 	// blue
        }
        return data;
    }
}