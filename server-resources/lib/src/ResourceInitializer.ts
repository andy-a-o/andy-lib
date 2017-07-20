import {Listeners} from "@andy-lib/util";
import {Resource, ResourceListener} from "./Resource";
import {ErrorReporter} from "./ErrorReporter";

export interface ResourceInitListener {
    onResourceInitStarted?(initializer: ResourceInitializer);

    onResourceInitProgress?(initializer: ResourceInitializer, progress: number);

    onResourceInitFinished?(initializer: ResourceInitializer);
}

export class ResourceInitializer {
    private readonly resourceListeners = new Listeners<ResourceInitListener>([
        "onResourceInitStarted",
        "onResourceInitProgress",
        "onResourceInitFinished"
    ]);

    addResourceListener(l: ResourceInitListener) {
        this.resourceListeners.add(l);
    }

    removeResourceListener(l: ResourceInitListener) {
        this.resourceListeners.remove(l);
    }

    initialize(resources: Resource[]) {
        this.fireStarted();
        const arr = [];
        for (let i = 0, n = resources.length; i < n; ++i) {
            const resource = resources[i];
            if (!resource.isInitialized()) {
                arr.push(resource);
            }
        }
        if (!arr.length) {
            this.fireFinished();
            return;
        }
        this.initResources(arr);
    }

    protected initResources(resources: Resource[]) {
        const listener = {
            owner: this,
            done: 0,
            total: resources.length,
            onResourceInitialized(resource: Resource) {
                resource.removeResourceListener(this);
                this.owner.fireProgress(Math.floor(++this.done / this.total * 100));
                if (this.done == this.total) {
                    this.owner.fireFinished();
                }
            },
            onResourceInitializeError(resource: Resource, e) {
                resource.removeResourceListener(this);
                ErrorReporter.warn("Resource initialize failed: " +
                    resource.getSrc() + " (" + e + ")",
                    "ResourceInitializer");
            }
        } as ResourceListener;
        for (let i = 0, n = resources.length; i < n; ++i) {
            const resource = resources[i];
            resource.addResourceListener(listener);
            resource.initialize();
        }
    }

    protected fireStarted() {
        this.resourceListeners.call("onResourceInitStarted", [this]);
    }

    /**
     * @param progress 0-100
     */
    protected fireProgress(progress: number) {
        this.resourceListeners.call("onResourceInitProgress", [this, progress]);
    }

    protected fireFinished() {
        this.resourceListeners.call("onResourceInitFinished", [this]);
    }
}