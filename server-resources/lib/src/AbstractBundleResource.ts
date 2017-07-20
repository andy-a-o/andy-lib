import {Resource, ResourceConfig} from "./Resource";
import {Bundle, BundleListener, BundleSpriteConfig, BundleConfig} from "./Bundle";

export abstract class AbstractBundleResource<C extends BundleConfig<S>, S extends BundleSpriteConfig> extends Resource implements BundleListener<C, S> {
    private readonly name: string;
    private readonly bundle: Bundle<C, S>;
    private readonly resources: ResourceConfig[] = [];

    constructor(res: ResourceConfig, bundle: Bundle<C, S>) {
        super(res);
        const i = res.src.indexOf(":");
        this.name = res.src.substring(i + 1);
        this.bundle = bundle;
        this.bundle.addBundleListener(this);
    }

    getSize(): number {
        return 0;
    }

    getName(): string {
        return this.name;
    }

    getBundle(): Bundle<C, S> {
        return this.bundle;
    }

    isLoaded(): boolean {
        return this.bundle.isLoaded();
    }

    isInitialized(): boolean {
        return this.bundle.isInitialized();
    }

    assign<T extends ResourceConfig>(res: T) {
        if (this.bundle.isLoaded()) {
            const bundle = this.bundle;
            const bundleResources = bundle.getResources();
            const sprite = bundle.getSprite(this.name);
            this.assignToResource(res, sprite, bundleResources);
        } else {
            this.resources.push(res);
        }
    }

    onBundleLoaded(bundle: Bundle<C, S>) {
        if (bundle.isInitialized()) {
            this.processResources();
        }
        this.fireLoaded();
    }

    onBundleInitialized() {
        this.processResources();
        this.fireInitialized();
    }

    private processResources() {
        const resources = this.resources;
        const bundle = this.bundle;
        const bundleResources = bundle.getResources();
        const sprite = bundle.getSprite(this.name);
        for (let i = 0, n = resources.length; i < n; ++i) {
            this.assignToResource(resources[i], sprite, bundleResources);
        }
    }

    protected abstract assignToResource<T extends ResourceConfig>(res: T, sprite: S, bundleResources: C[]);

    protected loadFromUrl(url: string) {
        // Do nothing
    }
}