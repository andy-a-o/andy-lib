import {Resource, ResourceListener, ResourceConfig} from "./Resource";
import {Listeners} from "@andy-lib/util";

export interface BundleListener<C extends BundleConfig<S>, S extends BundleSpriteConfig> {
    onBundleLoaded?(bundle: Bundle<C, S>);

    onBundleInitialized?(bundle: Bundle<C, S>);
}

export interface BundleSpriteConfig {
    name: string;
}

export interface BundleConfig<S extends BundleSpriteConfig> extends ResourceConfig {
    sprites: S[];
}

export class Bundle<C extends BundleConfig<S>, S extends BundleSpriteConfig> implements ResourceListener {
    private readonly bundleListeners = new Listeners<BundleListener<C, S>>([
        "onBundleLoaded",
        "onBundleInitialized"
    ]);

    private readonly sprites: { [name: string]: S } = {};
    private readonly resources: C[] = [];
    private resourcesTotal: number;
    private resourcesLoaded: number;
    private resourcesInitialized: number;

    constructor(private name: string) {
        this.resourcesTotal = 0;
        this.resourcesLoaded = 0;
        this.resourcesInitialized = 0;
    }

    addSprites(sprites: S[]) {
        for (let i = 0, n = sprites.length; i < n; ++i) {
            const sprite = sprites[i];
            this.sprites[sprite.name] = sprite;
        }
    }

    addBundleListener(l: BundleListener<C, S>) {
        this.bundleListeners.add(l);
    }

    removeBundleListener(l: BundleListener<C, S>) {
        this.bundleListeners.remove(l);
    }

    isLoaded(): boolean {
        return (this.resourcesLoaded == this.resourcesTotal);
    }

    isInitialized(): boolean {
        return (this.resourcesInitialized == this.resourcesTotal);
    }

    onResourceLoaded(resource: Resource) {
        this.handleResourceLoaded();
        if (resource.isInitialized()) {
            this.handleResourceInitialized();
        }
    }

    onResourceInitialized() {
        this.handleResourceInitialized();
    }

    addResource(resource: Resource, res: C) {
        this.resources.push(res);
        resource.addResourceListener(this);
        ++this.resourcesTotal;
    }

    getName(): string {
        return this.name;
    }

    getResources(): C[] {
        return this.resources;
    }

    getSprite(name: string): S {
        const sprite = this.sprites[name];
        console.assert(!!sprite, `No sprite ${name} found in bundle ${this.name}`);
        return sprite;
    }

    private handleResourceLoaded() {
        ++this.resourcesLoaded;
        if (this.resourcesLoaded == this.resourcesTotal) {
            this.fireLoaded();
        }
    }

    private handleResourceInitialized() {
        ++this.resourcesInitialized;
        if (this.resourcesInitialized == this.resourcesTotal) {
            this.fireInitialized();
        }
    }

    private fireLoaded() {
        this.bundleListeners.call("onBundleLoaded", [this]);
    }

    private fireInitialized() {
        this.bundleListeners.call("onBundleInitialized", [this]);
    }
}