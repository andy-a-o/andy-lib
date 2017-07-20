import {ProfilerExtension} from "./ProfilerExtension";
import {ProfilerContext, ProfilerContextListener} from "./ProfilerContext";

export class FrameExtension extends ProfilerExtension implements ProfilerContextListener {
    private frames: number[][];

    constructor() {
        super("frames");
    }

    init(context: ProfilerContext) {
        context.addContextListener(this);
        const chunkSize = context.getChunkSize();
        this.frames = new Array<number[]>(chunkSize);
        for (let i = 0; i < chunkSize; ++i) {
            this.frames[i] = new Array(2);
        }
    }

    onFrameStart(context: ProfilerContext) {
        const currentFrame = context.getCurrentFrame();
        this.frames[currentFrame][0] = Date.now();
    }

    onFrameEnd(context: ProfilerContext) {
        const currentFrame = context.getCurrentFrame();
        this.frames[currentFrame][1] = Date.now();
    }

    serialize(context: ProfilerContext): string {
        return this.frames.join("|");
    }
}