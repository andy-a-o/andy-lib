import {Convolution, ConvolutionConfig} from "./Convolution";

export interface SharpFilterConfig extends ConvolutionConfig {
    matrix?: number[];
}

const DEFAULT_MATRIX = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
];

export class SharpFilter extends Convolution {
    private readonly matrix: number[];

    constructor(config: SharpFilterConfig) {
        super(config);
        this.matrix = config.matrix || DEFAULT_MATRIX;
    }

    protected getKernelMatrix(): number[] {
        return this.matrix;
    }
}