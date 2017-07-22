import {RenderObject, RenderObjectConfig} from "./RenderObject";
import {Rect} from "../util/Rect";
import {Profiler} from "@andy-lib/profiler";
import {ErrorReporter, VideoResourceConfig} from "@andy-lib/server-resources";

export interface VideoAnimationConfig extends RenderObjectConfig, VideoResourceConfig {
}

export class VideoAnimation extends RenderObject {
    private video: HTMLVideoElement;
    private timeDrawn?: number | undefined;

    constructor(res: VideoAnimationConfig) {
        super(res);
        this.video = res.vid;
    }

    update(rect: Rect) {
        const video = this.video;
        if (video.currentTime != this.timeDrawn) {
            this.setDirty(true);
        }
        super.update(rect);
    }

    protected render(ctx: CanvasRenderingContext2D) {
        Profiler.begin("render");
        const video = this.video;
        try {
            ctx.drawImage(video, 0, 0);
            const pixels = ctx.getImageData(0, 0, this.w * 2, this.h * 2);
            const data = pixels.data;
            for (let i = 3, n = data.length / 2, j = n + i - 1; i < n; i += 4, j += 4) {
                data[i] = data[j];
            }
            ctx.putImageData(pixels, 0, 0, 0, 0, this.w, this.h);
        } catch (e) {
            ErrorReporter.error(`Failed to draw video ${video.src}: ${e}`, "VideoAnimation");
        }
        Profiler.end("render");
    }

    protected saveState() {
        super.saveState();
        this.timeDrawn = this.video.currentTime;
    }

    toJSON(): any {
        return {
            ...super.toJSON(),
            url: this.video.src
        };
    }

    animate() {
        this.video.currentTime = 0;
        this.video.play();
    }

    protected createCanvas(w: number, h: number): HTMLCanvasElement {
        return super.createCanvas(w * 2, h * 2);
    }
}