import {Listeners} from "@andy-lib/util";
import {ContentServerManager} from "./ContentServerManager";
import {Resource, ResourceListener} from "./Resource";
import {ContentServer} from "./ContentServer";
import {ErrorReporter} from "./ErrorReporter";

abstract class ResourceWithProgress extends Resource {
    prevProgress?: number | undefined;
}

export interface ResourceLoadListener {
    onLoadProgress?(loader: ResourceLoader);

    onResourceLoadFinished?(loader: ResourceLoader);
}

export class ResourceLoader implements ResourceListener {
    private readonly resourceLoaderListeners = new Listeners<ResourceLoadListener>([
        "onLoadProgress",
        "onResourceLoaded",
        "onResourceLoadFinished"
    ]);

    private readonly resources: { [src: string]: Resource } = {};
    private totalSize: number = 0;
    private totalCount: number = 0;
    private loadedSize: number = 0;
    private loadedCount: number = 0;
    private maxLoadAttempts: number = 1;
    private retryUsingCache: boolean = false;

    constructor(private contentServerManager: ContentServerManager) {
    }

    addResourceLoaderListener(l: ResourceLoadListener) {
        this.resourceLoaderListeners.add(l);
    }

    removeResourceLoaderListener(l: ResourceLoadListener) {
        this.resourceLoaderListeners.remove(l);
    }

    setRetryUsingCache(value: boolean) {
        this.retryUsingCache = value;
    }

    setMaxLoadAttempts(attempts: number) {
        this.maxLoadAttempts = attempts;
    }

    getTotalSize(): number {
        return this.totalSize;
    }

    getTotalCount(): number {
        return this.totalCount;
    }

    getLoadedSize(): number {
        return this.loadedSize;
    }

    getLoadedCount(): number {
        return this.loadedCount;
    }

    /**
     * @returns {number} 0..100
     */
    getLoadProgress(): number {
        return Math.floor(this.loadedSize / this.totalSize * 100);
    }

    addResource(resource: Resource) {
        if (!this.resources[resource.getSrc()]) {
            this.resources[resource.getSrc()] = resource;
            const size = resource.getSize();
            if (size) {
                this.totalSize += size;
            }
            ++this.totalCount;
        }
    }

    load() {
        if (!this.totalCount) {
            this.fireLoadFinished();
        }
        const resources = this.resources;
        for (let src in resources) {
            if (resources.hasOwnProperty(src)) {
                const resource = resources[src];
                resource.addResourceListener(this);
                const server = this.selectContentServer(resource);
                if (server) {
                    resource.load(server.getUrl(resource));
                }
            }
        }
    }

    getResources(): Resource[] {
        const arr = [];
        const resources = this.resources;
        for (let src in resources) {
            if (resources.hasOwnProperty(src)) {
                arr.push(resources[src]);
            }
        }
        return arr;
    }

    protected selectContentServer(resource: Resource): ContentServer {
        return this.contentServerManager.selectContentServer(resource);
    }

    onResourceLoadProgress(resource: Resource, progress: number) {
        this.loadProgress(resource, progress);
        this.fireLoadProgress();
    }

    onResourceLoaded(resource: Resource) {
        this.loadProgress(resource, 100);
        this.fireLoadProgress();
        if (++this.loadedCount == this.totalCount) {
            this.fireLoadFinished();
        }
    }

    onResourceLoadError(resource: Resource, details: any) {
        const message = "Resource load failed after " +
            resource.getLoadAttempts() + " attempts: " +
            resource.getSrc() +
            " (" + details + ")";
        if (resource.getLoadAttempts() >= this.maxLoadAttempts) {
            ErrorReporter.warn(message, "ResourceLoader");
            return;
        } else {
            console.warn(message);
        }
        const server = this.selectContentServer(resource);
        const url = server.getUrl(resource);
        console.debug("Re-loading " + resource.getSrc() + " from " + url);
        resource.load(url, !this.retryUsingCache);
    }

    onResourceLoadTimeout(resource: Resource) {
        console.warn("Resource load timed out: " + resource.getSrc());
        this.onResourceLoadError(resource, "timeout");
    }

    /**
     * @param {Resource} resource
     * @param {number} progress 0-100
     */
    private loadProgress(resource: ResourceWithProgress, progress: number) {
        const prevProgress = resource.prevProgress || 0;
        const delta = progress - prevProgress;
        resource.prevProgress = progress;
        const size = resource.getSize();
        if (size) {
            this.loadedSize += Math.floor(size * delta / 100);
        }
    }

    private fireLoadProgress() {
        this.resourceLoaderListeners.call("onLoadProgress", [this]);
    }

    private fireLoadFinished() {
        this.resourceLoaderListeners.call("onResourceLoadFinished", [this]);
    }
}