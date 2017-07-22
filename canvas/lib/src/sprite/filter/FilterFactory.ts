import {AbstractFilter} from "./AbstractFilter";
import {GrayscaleFilter} from "./GrayscaleFilter";
import {SharpFilter, SharpFilterConfig} from "./SharpFilter";
import {StrokeFilter, StrokeFilterConfig} from "./StrokeFilter";

export type FilterType = "grayscale" | "stroke" | "sharp";

export interface FilterFactoryConfig {
    stroke?: StrokeFilterConfig;
    sharp?: SharpFilterConfig;
}

export class FilterFactory {
    private readonly defaults: FilterFactoryConfig;

    constructor(defaults?: FilterFactoryConfig) {
        this.defaults = defaults || {};
    }

    newFilter(key: FilterType, config: any): AbstractFilter {
        config = {...this.defaults, ...config};
        switch (key) {
            case "grayscale":
                return new GrayscaleFilter();
            case "stroke":
                return new StrokeFilter(<StrokeFilterConfig>config);
            case "sharp":
                return new SharpFilter(<SharpFilterConfig>config);
        }
        throw new Error(`Unknown filter: ${key}`);
    }
}