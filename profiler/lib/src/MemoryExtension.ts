import {ProfilerExtension} from "./ProfilerExtension";
import {ProfilerContext, ProfilerContextListener} from "./ProfilerContext";

export class MemoryExtension extends ProfilerExtension implements ProfilerContextListener {
    private readonly memoryInfoAvailable: boolean;
    private memory: number[][];

    constructor() {
        super("memory");
        this.memoryInfoAvailable = !!(window.performance && window.performance["memory"]);
    }

    init(context: ProfilerContext) {
        const chunkSize = context.getChunkSize();
        this.memory = new Array<number[]>(chunkSize);
        for (let i = 0; i < chunkSize; ++i) {
            this.memory[i] = new Array(2);
        }
        context.addContextListener(this);
    }

    onFrameEnd(context: ProfilerContext) {
        const memory = (window.performance && window.performance["memory"]) || {};
        const currentFrame = context.getCurrentFrame();
        this.memory[currentFrame][0] = memory.totalJSHeapSize || 0;
        this.memory[currentFrame][1] = memory.usedJSHeapSize || 0;
    }

    serialize(context: ProfilerContext): string | null {
        return this.memoryInfoAvailable ? this.memory.join("|") : null;
    }
}