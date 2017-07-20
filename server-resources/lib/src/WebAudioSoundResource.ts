import {Resource} from "./Resource";
import {BlobRequest, BlobRequestListener} from "./BlobRequest";
import {SoundResourceConfig} from "./SoundResource";

export interface WebAudioResourceConfig extends SoundResourceConfig {
    buffer?: AudioBuffer | undefined;
}

export class WebAudioSoundResource extends Resource implements BlobRequestListener {
    private readonly decodeCompleteHandler: DecodeSuccessCallback;
    private readonly decodeErrorHandler: DecodeErrorCallback;
    private readonly assignedResources: WebAudioResourceConfig[] = [];

    private request?: BlobRequest | undefined;
    private decodedData?: AudioBuffer | undefined;
    private blob?: ArrayBuffer | undefined;

    constructor(res: WebAudioResourceConfig) {
        super(res);
        this.decodeCompleteHandler = this.onAudioBufferDecoded.bind(this);
        this.decodeErrorHandler = this.onAudioBufferDecodeError.bind(this);
    }

    isInitialized(): boolean {
        return !!this.decodedData;
    }

    initialize() {
        console.assert(!!this.blob);
        console.assert(!!context);
        context.decodeAudioData(
            this.blob,
            this.decodeCompleteHandler,
            this.decodeErrorHandler);
    }

    assign(res: WebAudioResourceConfig) {
        if (this.isInitialized()) {
            res.buffer = this.decodedData;
            return;
        }
        this.assignedResources.push(res);
    }

    cancel() {
        this.request && this.request.cancel();
    }

    protected loadFromUrl(url: string) {
        this.request = new BlobRequest(url, "GET", "arraybuffer");
        this.request.addRequestListener(this);
        this.request.load();
    }

    /**
     * @param request
     * @param progress 0-100
     */
    onBlobLoadProgress(request: BlobRequest, progress: number) {
        this.bytes = request.getBytesLoaded();
        this.fireProgress(progress);
    }

    onBlobLoadStarted() {
        this.fireLoadStarted();
    }

    onBlobLoadError(request: BlobRequest, error: any) {
        this.fireError(error);
    }

    onBlobLoaded(request: BlobRequest) {
        this.blob = request.getResponse();
        this.fireLoaded();
    }

    onAudioBufferDecoded(decodedData: AudioBuffer) {
        this.decodedData = decodedData;
        const resources = this.assignedResources;
        for (let i = 0, n = resources.length; i < n; ++i) {
            resources[i].buffer = decodedData;
        }
        this.fireInitialized();
    }

    onAudioBufferDecodeError(e: DOMException) {
        this.fireInitializeError(e);
    }

    static isSupported(): boolean {
        return supported;
    }

    static getContext(): AudioContext {
        return context;
    }
}

const context: AudioContext = window["webkitAudioContext"]
    ? new window["webkitAudioContext"]()
    : window["AudioContext"]
        ? new AudioContext()
        : null;

const supported = context && BlobRequest.isSupported();