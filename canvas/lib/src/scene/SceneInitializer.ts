import {Listeners} from "@andy-lib/util";
import {Scene} from "./Scene";

export interface SceneInitializerListener {
    onSceneInitializationDone(initializer: SceneInitializer);
}

export abstract class SceneInitializer {
    private readonly sceneInitializerListeners = new Listeners<SceneInitializerListener>([
        "onSceneInitializationDone"
    ]);

    addSceneInitializerListener(l: SceneInitializerListener) {
        this.sceneInitializerListeners.add(l);
    }

    removeSceneInitializerListener(l: SceneInitializerListener) {
        this.sceneInitializerListeners.remove(l);
    }

    abstract initialize(scene: Scene<any, any>);

    protected fireDone() {
        this.sceneInitializerListeners.call("onSceneInitializationDone", [this]);
    }
}