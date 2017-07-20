import {ProfilerExtension} from "./ProfilerExtension";
import {ProfilerContext} from "./ProfilerContext";

export interface ErrorExtensionOptions {
    count?: number | undefined;
}

const DEFAULT_ERROR_COUNT = 10;

export class ErrorExtension extends ProfilerExtension {
    private readonly errors: string[];
    private readonly frames: number[];
    private errorIndex: number;

    constructor(options: ErrorExtensionOptions) {
        super("errors");
        this.errorIndex = 0;
        const errorCount = options.count || DEFAULT_ERROR_COUNT;
        this.errors = new Array<string>(errorCount);
        this.frames = new Array<number>(errorCount);
    }

    error(message: string, context: ProfilerContext) {
        this.errors[this.errorIndex] = message.replace(/\n/g, "\v");
        this.frames[this.errorIndex] = context.getCurrentFrame();
        ++this.errorIndex;
    }

    reset(context: ProfilerContext) {
        this.errorIndex = 0;
    }

    serialize(context: ProfilerContext): string | null {
        if (this.errorIndex == 0) {
            return null;
        }
        const events = new Array(2);
        events[0] = this.frames.slice(0, this.errorIndex).join(",");
        events[1] = this.errors.slice(0, this.errorIndex).join(",");
        return events.join("|");
    }
}