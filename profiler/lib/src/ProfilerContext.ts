import {Listeners} from "@andy-lib/util";
import {ProfilerExtension} from "./ProfilerExtension";
import {RequestFactory} from "@andy-lib/server";
import {ProfilerConfig} from "./Profiler";

export interface ProfilerContextListener {
    onFrameStart?(context: ProfilerContext);

    onFrameEnd?(context: ProfilerContext);

    onNextFrame?(context: ProfilerContext);
}

export class ProfilerContext {

    private readonly contextListeners = new Listeners<ProfilerContextListener>([
        "onFrameStart",
        "onFrameEnd",
        "onNextFrame"
    ]);

    private currentFrame: number = 0;
    private readonly chunkSize: number;
    private readonly flushUrl: string;

    constructor(options: ProfilerConfig, private extensions: ProfilerExtension[]) {
        this.chunkSize = options.chunkSize;
        this.flushUrl = options.flushUrl;
    }

    addContextListener(l: ProfilerContextListener) {
        this.contextListeners.add(l);
    }

    removeContextListener(l: ProfilerContextListener) {
        this.contextListeners.remove(l);
    }

    init() {
        const extensions = this.extensions;
        for (let i = 0, n = extensions.length; i < n; ++i) {
            extensions[i].init(this);
        }
    }

    reset() {
        this.currentFrame = 0;
        const extensions = this.extensions;
        for (let i = 0, n = extensions.length; i < n; ++i) {
            extensions[i].reset(this);
        }
    }

    getCurrentFrame(): number {
        return this.currentFrame;
    }

    getChunkSize(): number {
        return this.chunkSize;
    }

    getFlushUrl(): string {
        return this.flushUrl;
    }

    endFrame() {
        this.fireFrameEnd();
        if (++this.currentFrame == this.chunkSize) {
            this.flush();
            this.reset();
        }
        this.fireNextFrame();
    }

    startFrame() {
        this.fireFrameStart();
    }

    private flush() {
        if (!this.flushUrl) {
            return;
        }
        // const timeBeforeFlush = Date.now();
        const extensions = this.extensions;
        const extensionNames: string[] = [];
        const lines: string[] = [];
        for (let i = 0, n = extensions.length; i < n; ++i) {
            const ext = extensions[i];
            const data = ext.serialize(this);
            if (data) {
                lines.push(data);
                extensionNames.push(ext.getName());
            }
        }
        lines.splice(0, 0, extensionNames.join(","));
        RequestFactory.newRequest("POST", this.flushUrl)
            .setContentType("text/plain")
            .setData(lines.join("\n"))
            .setProcessData(false)
            .send();
        // const timeTaken = Date.now() - timeBeforeFlush;
//        console.debug("Data flushed in " + timeTaken + "ms");
    }

    private fireFrameStart() {
        this.contextListeners.call("onFrameStart", [this]);
    }

    private fireFrameEnd() {
        this.contextListeners.call("onFrameEnd", [this]);
    }

    private fireNextFrame() {
        this.contextListeners.call("onNextFrame", [this]);
    }
}