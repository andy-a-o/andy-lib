import {ProfilerExtension} from "./ProfilerExtension";
import {ProfilerContextListener, ProfilerContext} from "./ProfilerContext";

export interface NamedProfilerExtensionOptions {
    names?: string[] | undefined;
    auto?: boolean | undefined;
}

export class NamedProfilerExtension extends ProfilerExtension implements ProfilerContextListener {
    private readonly profilers: string[];
    private readonly start: { [name: string]: number } = {};
    private readonly time: { [pro: string]: number[] } = {};
    private readonly count: { [name: string]: number[] } = {};
    private readonly autoCreate: boolean;

    constructor(options: NamedProfilerExtensionOptions) {
        super("profilers");
        this.profilers = options.names || [];
        this.autoCreate = !!options.auto;
    }

    init(context: ProfilerContext) {
        context.addContextListener(this);
        const chunkSize = context.getChunkSize();
        const profilers = this.profilers;
        for (let i = 0, n = profilers.length; i < n; ++i) {
            this.createProfiler(profilers[i], chunkSize, 0);
        }
    }

    begin(name: string, context: ProfilerContext) {
        if (!this.time[name]) {
            if (this.autoCreate) {
                this.profilers.push(name);
                this.createProfiler(name, context.getChunkSize(), context.getCurrentFrame());
            } else {
                return;
            }
        }
        this.start[name] = Date.now();
    }

    end(name: string, context: ProfilerContext) {
        if (!this.time[name]) {
            return;
        }
        const frame = context.getCurrentFrame();
        this.time[name][frame] += (Date.now() - this.start[name]);
        ++this.count[name][frame];
    }

    onNextFrame(context: ProfilerContext) {
        const frame = context.getCurrentFrame();
        const profilers = this.profilers;
        for (let i = 0, n = profilers.length; i < n; ++i) {
            const name = profilers[i];
            this.time[name][frame] = 0;
            this.count[name][frame] = 0;
        }
    }

    serialize(context: ProfilerContext): string {
        const profilers = this.profilers;
        const time = this.time;
        const count = this.count;
        const profilerCount = profilers.length;
        const data: string[] = [];
        for (let i = 0; i < profilerCount; ++i) {
            const profilerName = profilers[i];
            if (!time[profilerName]) {
                continue;
            }
            data.push(profilerName);
            data.push(time[profilerName].join(","));
            data.push(count[profilerName].join(","));
        }
        return data.join("|");
    }

    private createProfiler(name: string, chunkSize: number, currentIndex: number) {
        this.time[name] = new Array<number>(chunkSize);
        this.count[name] = new Array<number>(chunkSize);
        for (let i = 0; i <= currentIndex; ++i) {
            this.time[name][i] = 0;
            this.count[name][i] = 0;
        }
    }
}