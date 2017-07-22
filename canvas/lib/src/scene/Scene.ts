import {ResourceManager, ResourceManagerFactory, ResourceManagerListener} from "@andy-lib/server-resources";
import {Listeners} from "@andy-lib/util";
import {Stage} from "../sprite/Stage";
import {Profiler} from "@andy-lib/profiler";
import {Request, RequestFactory} from "@andy-lib/server";

export interface SceneListener<C, R> {
    onSceneLoadBegin?(scene: Scene<C, R>);

    onSceneLoadProgress?(scene: Scene<C, R>, progress: number);

    onSceneLoaded?(scene: Scene<C, R>);

    onSceneInitialized?(scene: Scene<C, R>);

    onSceneDestroyed?(scene: Scene<C, R>);

    onSceneConfigured?(scene: Scene<C, R>);

    onSceneStarted?(scene: Scene<C, R>);

    onSceneStopped?(scene: Scene<C, R>);
}

/**
 * Strange, but some browsers may not render the image via drawImage
 * even if it"s completely loaded. But after such a delay between
 * onload event and drawImage call everything is ok.
 */
const CREATE_DELAY: number = 1000;

export abstract class Scene<C, R> implements ResourceManagerListener {
    private readonly sceneListeners = new Listeners<SceneListener<C, R>>([
        "onSceneLoadBegin",
        "onSceneLoadProgress",
        "onSceneLoaded",
        "onSceneInitialized",
        "onSceneDestroyed",
        "onSceneConfigured",
        "onSceneStarted",
        "onSceneStopped"
    ]);

    private readonly stage: Stage;
    private initialized: boolean = false;
    private configVolatile: boolean = false;
    private loaded: boolean = false;
    private wasStarted: boolean = false;
    private readonly resourceManager: ResourceManager;

    private loadTime?: number | undefined;
    private loadProgress?: number | undefined;
    private loadStart?: number | undefined;
    private total?: number | undefined;

    constructor(protected canvas: HTMLCanvasElement, protected resourceManagerFactory: ResourceManagerFactory) {
        this.stage = this.createStage(canvas);
        this.resourceManager = resourceManagerFactory.newResourceManager();
        this.resourceManager.addResourceListener(this);
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    getStage(): Stage {
        return this.stage;
    }

    getResourceManager(): ResourceManager {
        return this.resourceManager;
    }

    addSceneListener(l: SceneListener<C, R>) {
        this.sceneListeners.add(l);
    }

    removeSceneListener(l: SceneListener<C, R>) {
        this.sceneListeners.remove(l);
    }

    init() {
        console.assert(!this.initialized, "Scene already initialized!");
        event(this, "init");
        this.configure();
    }

    destroy() {
        this.stop();
        this.fireDestroyed();
    }

    start() {
        event(this, "starting");
        const configUri = this.getConfigUri();
        if (this.wasStarted && configUri && this.configVolatile) {
            const request = RequestFactory.newRequest("GET", configUri);
            const scene = this;
            request.addRequestListener({
                onRequestCompleted: function (request, config) {
                    scene.update(config);
                    scene.started();
                }
            });
            request.send();
        } else {
            this.started();
            this.wasStarted = true;
        }
    }

    stop() {
        this.stopped();
    }

    /**
     * @return Config URI or <code>null</code> if none required.
     */
    protected getConfigUri(): string | null {
        return null;
    }

    protected abstract getResourceUri(): string;

    getLoadTime(): number {
        return this.loadTime;
    }

    getLoadProgress(): number {
        return this.loadProgress;
    }

    protected setConfigVolatile(configVolatile: boolean) {
        this.configVolatile = configVolatile;
    }

    /**
     * @return Whether it is needed to reload config from server each time scene is started.
     */
    protected isConfigVolatile(): boolean {
        return this.configVolatile;
    }

    /**
     * @protected
     */
    protected loadAndUpdate() {
        const configUri = this.getConfigUri();
        if (configUri) {
            const scene = this;
            const request = RequestFactory.newRequest("GET", configUri);
            request.addRequestListener({
                onRequestCompleted(request: Request, config: C) {
                    scene.update(config);
                }
            });
            request.send();
        }
    }

    protected loadResources() {
        event(this, "loadResources");
        const scene = this;
        const request = RequestFactory.newRequest("GET", this.getResourceUri());
        request.addRequestListener({
            onRequestCompleted(request: Request, response: R) {
                scene.downloadAllResources(response);
            }
        });
        request.send();
    }

    /**
     * Performs all scene configuration before initialization
     * (loads all required model from server etc.)
     */
    protected configure() {
        const configUri = this.getConfigUri();
        if (configUri) {
            event(this, "configure");
            const scene = this;
            const request = RequestFactory.newRequest("GET", configUri);
            request.addRequestListener({
                onRequestCompleted(request: Request, dto: C) {
                    event(this, "setup");
                    scene.setup(dto);
                    scene.loadResources();
                }
            });
            request.send();
        } else {
            this.loadResources();
        }
    }

    /**
     * Called when the scene has started first time.
     */
    protected setup(config: C) {
        // Nothing to do
    }

    /**
     * Called for scenes which require config re-load after the scene has started,
     * but not in the first time (see {@link setConfigVolatile} and {@link isConfigVolatile}).
     */
    protected update(config: C) {
        // Nothing to do
    }

    protected create() {
        if (!this.initialized) {
            Profiler.begin("create");
            this.initStage(this.stage, <R>this.resourceManager.getResources());
            Profiler.end("create");
            this.initialized = true;
            this.fireInitialized();
            event(this, "created");
        }
    }

    protected abstract initStage(stage: Stage, resources: R);

    onResourceLoadStarted(size: number) {
        event(this, "loading");
        this.total = size;
        this.loadStart = Date.now();
        this.fireLoadBegin();
    }

    onResourceLoadProgress(progress: number) {
        this.fireLoadProgress(progress);
        this.loadProgress = progress;
        this.loadTime = Date.now() - this.loadStart;
    }

    onResourceLoadFinished() {
        event(this, "loaded");
        this.loaded = true;
        this.fireLoadProgress(100);
        this.fireLoaded();
        window.setTimeout(() => {
            this.create();
        }, CREATE_DELAY);
    }

    downloadAllResources(resources: R) {
        event(this, "resources");
        this.resourceManager.load(resources);
    }

    protected started() {
        event(this, "started");
        this.stage.start();
        this.fireStarted();
    }

    protected stopped() {
        event(this, "stopped");
        this.stage.stop();
        this.fireStopped();
    }

    protected createStage(canvas: HTMLCanvasElement): Stage {
        return new Stage(canvas);
    }

    private fireLoadBegin() {
        this.sceneListeners.call("onSceneLoadBegin", [this]);
    }

    private fireLoadProgress(percent: number) {
        this.sceneListeners.call("onSceneLoadProgress", [this, percent]);
    }

    private fireLoaded() {
        this.sceneListeners.call("onSceneLoaded", [this]);
    }

    private fireInitialized() {
        this.sceneListeners.call("onSceneInitialized", [this]);
    }

    private fireDestroyed() {
        this.sceneListeners.call("onSceneDestroyed", [this]);
    }

    private fireConfigured() {
        this.sceneListeners.call("onSceneConfigured", [this]);
    }

    private fireStarted() {
        this.sceneListeners.call("onSceneStarted", [this]);
    }

    private fireStopped() {
        this.sceneListeners.call("onSceneStopped", [this]);
    }

    toJSON(): any {
        return {
            total: this.total,
            loadStart: this.loadStart,
            loadProgress: this.loadProgress,
            loadTime: this.loadTime,
            loaded: this.loaded,
            initialized: this.initialized
        };
    }
}

function event(scene: Scene<any, any>, text: string) {
    const message = `${scene.constructor["name"]}: ${text}`;
    Profiler.event(message);
    console.log(Date.now() + ":" + message);
}