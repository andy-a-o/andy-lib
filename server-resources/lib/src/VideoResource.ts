import {Resource, ResourceConfig} from "./Resource";

export interface VideoResourceConfig extends ResourceConfig {
    vid?: HTMLVideoElement | undefined;
}

export class VideoResource extends Resource {
    private readonly video: HTMLVideoElement;

    constructor(res) {
        super(res);
        const video = document.createElement("video");
        video.onloadstart = () => {
            this.fireLoadStarted();
        };
        video.onerror = (e) => {
            this.fireError(e);
        };
        video.oncanplaythrough = () => {
            this.fireLoaded();
        };
        this.video = video;
    }

    assign(res: VideoResourceConfig) {
        res.vid = this.video;
    }

    protected loadFromUrl(url: string) {
        this.video.src = url;
        this.video.load();
    }
}