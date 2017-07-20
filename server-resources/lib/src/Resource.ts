import {Listeners} from "@andy-lib/util";
import {Timer} from "@andy-lib/util";

export interface ResourceListener {
    onResourceLoadStarted?(resource: Resource);

    onResourceLoadProgress?(resource: Resource, progress: number);

    onResourceLoadError?(resource: Resource, error: any);

    onResourceLoadTimeout?(resource: Resource);

    onResourceLoaded?(resource: Resource);

    onResourceInitializeError?(resource: Resource, error: any);

    onResourceInitialized?(resource: Resource);
}

export interface ResourceConfig {
    /**
     * Resource URL. Could be <bundleName>:<spriteName> for bundled resources.
     */
    src: string;
    /**
     * Resource size in bytes.
     */
    size?: number | undefined;
    /**
     * Resource group.
     */
    rgroup?: string | undefined;
    /**
     * Bundle name. The name of the bundle that is contained in this resource.
     */
    bundle?: string | undefined;
}

const mimeTypes = {
    jpg: "image/jpeg",
    png: "image/png",
    ogg: "audio/ogg",
    mp3: "audio/mpeg"
};

export abstract class Resource {
    private readonly src: string;
    private readonly size: number;
    protected bytes: number = 0;
    private loaded: boolean = false;
    private versioned: boolean = false;
    private loadAttempts: number = 0;
    private nocache: boolean | undefined;
    private useNoCacheUrls: boolean | undefined;
    private timer: Timer | undefined;

    private readonly resourceListeners = new Listeners<ResourceListener>([
        "onResourceLoadStarted",
        "onResourceLoadProgress",
        "onResourceLoadError",
        "onResourceLoadTimeout",
        "onResourceLoaded",
        "onResourceInitializeError",
        "onResourceInitialized"
    ]);

    constructor(res: ResourceConfig) {
        this.src = res.src;
        this.size = res.size || 0;
    }

    setVersioned(versioned: boolean) {
        this.versioned = versioned;
    }

    isVersioned(): boolean {
        return this.versioned;
    }

    getSrc(): string {
        return this.src;
    }

    getSize(): number {
        return this.size;
    }

    getMimeType(): string {
        const src = this.src;
        const i = src.lastIndexOf(".");
        const ext = (i !== -1) ? src.substr(i + 1).toLowerCase() : "";
        return mimeTypes[ext];
    }

    isLoaded(): boolean {
        return this.loaded;
    }

    isInitialized(): boolean {
        return true;
    }

    getLoadAttempts(): number {
        return this.loadAttempts;
    }

    setNoCache(nocache: boolean) {
        this.nocache = nocache;
    }

    setUseNoCacheUrls(useNoCacheUrls: boolean) {
        this.useNoCacheUrls = useNoCacheUrls;
    }

    addResourceListener(l: ResourceListener) {
        this.resourceListeners.add(l);
    }

    removeResourceListener(l: ResourceListener) {
        this.resourceListeners.remove(l);
    }

    setTimeout(timeout: number) {
        if (!timeout) {
            if (this.timer) {
                this.timer.stop();
                this.timer = undefined;
            }
            return;
        }
        if (!this.timer) {
            this.timer = new Timer(timeout);
            this.timer.addTimerListener(this);
        } else {
            this.timer.setInterval(timeout);
        }
    }

    onTimer(timer: Timer) {
        timer.stop();
        this.cancel();
        this.fireTimeout();
    }

    load(url: string, nocache: boolean = false) {
        if (this.loaded) {
            this.fireLoaded();
            return;
        }
        if (nocache || this.nocache) {
            if (this.useNoCacheUrls) {
                url += ("/" + Date.now());
            } else {
                url += (url.indexOf("?") > 0 ? "&" : "?") + "time=" + Date.now();
            }
        }
        if (++this.loadAttempts > 1) {
            url += (url.indexOf("?") > 0 ? "&" : "?") + "attempt=" + this.loadAttempts;
        }
        this.loadFromUrl(url);
    }

    cancel() {
        // Stub
    }

    initialize() {
        // Stub
    }

    assign<T extends ResourceConfig>(res: T) {
        // Stub
    }

    protected abstract loadFromUrl(url: string);

    getBytesLoaded(): number {
        return this.bytes;
    }

    protected fireLoadStarted() {
        this.timer && this.timer.start();
        this.resourceListeners.call("onResourceLoadStarted", [this]);
    }

    protected fireLoaded() {
        this.loaded = true;
        this.timer && this.timer.stop();
        this.resourceListeners.call("onResourceLoaded", [this]);
    }

    protected fireError(info: any) {
        this.timer && this.timer.stop();
        this.resourceListeners.call("onResourceLoadError", [this, info]);
    }

    protected fireTimeout() {
        this.timer && this.timer.stop();
        this.resourceListeners.call("onResourceLoadTimeout", [this]);
    }

    /**
     * @param progress 0-100
     */
    protected fireProgress(progress: number) {
        const timer = this.timer;
        if (timer) {
            timer.stop();
            timer.start();
        }
        this.resourceListeners.call("onResourceLoadProgress", [this, progress]);
    }

    protected fireInitialized() {
        this.resourceListeners.call("onResourceInitialized", [this]);
    }

    protected fireInitializeError(e: any) {
        this.resourceListeners.call("onResourceInitializeError", [this, e]);
    }
}