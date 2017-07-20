import {Browser, Listeners} from "@andy-lib/util";
import {ResourceInitializer, ResourceInitListener} from "./ResourceInitializer";
import {ContentServerManager} from "./ContentServerManager";
import {ResourceFactory} from "./ResourceFactory";
import {ResourceMatcher} from "./ResourceMatcher";
import {ResourceLoader, ResourceLoadListener} from "./ResourceLoader";
import {ResourceConfig} from "./Resource";
import {BundleConfig} from "./Bundle";

export interface ResourceManagerListener {
    onResourceLoadStarted?(totalSize: number, totalCount: number);

    onResourceLoadProgress?(progress: number);

    onResourceLoadFinished?(manager: ResourceManager);
}

const skipKeys = {
    img: true,
    vid: true,
    snd: true,
    canvas: true
};

const browserDependentFeatures = {
    cursor: true
};

export class ResourceManager implements ResourceLoadListener, ResourceInitListener {
    private readonly resourceListeners = new Listeners<ResourceManagerListener>([
        "onResourceLoadStarted",
        "onResourceLoadProgress",
        "onResourceLoadFinished"
    ]);

    private res = {};
    private loadAttempts: number = 1;

    private resourceInitializer = new ResourceInitializer();
    private resourceMatcher?: ResourceMatcher | undefined;

    constructor(private readonly contentServerManager: ContentServerManager,
                private readonly resourceFactory: ResourceFactory) {

        this.resourceInitializer.addResourceListener(this);
    }

    addResourceListener(l: ResourceManagerListener) {
        this.resourceListeners.add(l);
    }

    removeResourceListener(l: ResourceManagerListener) {
        this.resourceListeners.remove(l);
    }

    getResources(): any {
        return this.res;
    }

    setLoadAttempts(attempts: number) {
        this.loadAttempts = attempts;
    }

    setResourceMatcher(resourceMatcher: ResourceMatcher) {
        this.resourceMatcher = resourceMatcher;
    }

    setResourceInitializer(resourceInitializer: ResourceInitializer) {
        this.resourceInitializer = resourceInitializer;
        this.resourceInitializer.addResourceListener(this);
    }

    getResourceInitializer(): ResourceInitializer {
        return this.resourceInitializer;
    }

    onLoadProgress(resourceLoader: ResourceLoader) {
        this.fireLoadProgress(resourceLoader.getLoadProgress());
    }

    onResourceLoadFinished(loader: ResourceLoader) {
        this.fireLoadProgress(100);
        this.resourceInitializer.initialize(loader.getResources());
    }

    onResourceInitFinished() {
        this.fireLoadFinished();
    }

    load(res: any) {
        const loader = new ResourceLoader(this.contentServerManager);
        loader.setMaxLoadAttempts(this.loadAttempts);
        loader.addResourceLoaderListener(this);
        this.collectUnloadedResources({...this.res, ...res}, loader);
        this.fireLoadStarted(loader.getTotalSize(), loader.getTotalCount());
        loader.load();
    }

    protected fireLoadStarted(totalSize: number, totalCount: number) {
        this.resourceListeners.call("onResourceLoadStarted", [totalSize, totalCount]);
    }

    protected fireLoadProgress(progress: number) {
        this.resourceListeners.call("onResourceLoadProgress", [progress]);
    }

    protected fireLoadFinished() {
        this.resourceListeners.call("onResourceLoadFinished", [this]);
    }

    protected collectUnloadedResources(object: ResourceConfig, resourceLoader: ResourceLoader) {
        if (!object) {
            return;
        }
        if (this.resourceMatcher && !this.resourceMatcher.match(object)) {
            return;
        }
        if (object instanceof Array) {
            for (let i = 0, n = object.length; i < n; ++i) {
                this.collectUnloadedResources(object[i], resourceLoader);
            }
        } else if (typeof object == "object") {
            const resourceFactory = this.resourceFactory;
            let bundleOpen = false;
            if (object.bundle) {
                resourceFactory.addBundle(object.bundle, (<BundleConfig<any>>object).sprites);
                bundleOpen = true;
            }
            if (object.src) {
                const resource = resourceFactory.newResource(object);
                if (resource && !resource.isLoaded()) {
                    resourceLoader.addResource(resource);
                }
            }
            for (let key in object) {
                if (!object.hasOwnProperty(key)) {
                    continue;
                }
                if (!skipKeys[key]) {
                    const value = object[key];
                    if (browserDependentFeatures[key]) {
                        // Choose browser-specific version of resource
                        object[key] = browserSelect(object[key]);
                    }
                    this.collectUnloadedResources(value, resourceLoader);
                }
            }
            if (bundleOpen) {
                resourceFactory.closeBundle();
            }
        }
    }
}

function browserSelect(value: any): any {
    if (typeof value == "object") {
        for (let key in value) {
            if (value.hasOwnProperty(key)) {
                if (Browser[key]) {
                    return browserSelect(value[key]);
                }
            }
        }
        if (value.other) {
            return value.other;
        }
    }
    return value;
}

