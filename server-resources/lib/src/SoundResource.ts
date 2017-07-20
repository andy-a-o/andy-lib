import {Resource, ResourceConfig} from "./Resource";

export type SoundFormat = "ogg" | "mp3";

export interface SoundResourceConfig extends ResourceConfig {
    snd?: HTMLAudioElement | undefined;
    offset?: number | undefined;
    duration?: number | undefined;
}

export class SoundResource extends Resource {
    private readonly sound: HTMLAudioElement;

    constructor(res: ResourceConfig) {
        super(res);
        const sound = new Audio();
        sound.onloadstart = () => {
            this.fireLoadStarted();
        };
        sound.onerror = e => {
            this.fireError(e);
        };
        sound.oncanplaythrough = () => {
            this.fireLoaded();
        };
        this.sound = sound;
    }

    assign(res: SoundResourceConfig) {
        res.snd = this.sound;
    }

    protected loadFromUrl(url: string) {
        this.sound.src = url;
        this.sound.load();
    }

    static isSupportedFileExtension(ext: string): boolean {
        return (fileExt == ext) || ("wav" == ext);
    }

    static format: SoundFormat = SoundResource.isSupportedFileExtension("ogg") ? "ogg" : "mp3";
}

const soundFormats: { [key: string]: string } = {
    "ogg": "audio/ogg; codecs=vorbis",
    "mp3": "audio/mpeg"
};

function getFileExt(): string | undefined {
    const audio = new Audio();
    for (let ext in soundFormats) {
        if (soundFormats.hasOwnProperty(ext)) {
            const mime = soundFormats[ext];
            if (audio.canPlayType(mime)) {
                return ext;
            }
        }
    }
    return undefined;
}

const fileExt: string = getFileExt();