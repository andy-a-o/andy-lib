import {SceneInitializer, SceneInitializerListener} from "./SceneInitializer";
import {Scene} from "./Scene";

export class SceneInitializers extends SceneInitializer implements SceneInitializerListener {
    private readonly initializers: SceneInitializer[] = [];
    private scene?: Scene<any, any> | undefined;
    private currentIndex?: number | undefined;

    add(initializer: SceneInitializer) {
        initializer.addSceneInitializerListener(this);
        this.initializers.push(initializer);
    }

    remove(initializer: SceneInitializer) {
        const i = this.initializers.indexOf(initializer);
        if (i >= 0) {
            initializer.removeSceneInitializerListener(this);
            this.initializers.splice(i, 1);
        }
    }

    initialize(scene: Scene<any, any>) {
        this.scene = scene;
        this.currentIndex = 0;
        this.initializeNext();
    }

    onSceneInitializationDone() {
        ++this.currentIndex;
        this.initializeNext();
    }

    private initializeNext() {
        const i = this.currentIndex;
        const initializers = this.initializers;
        if (i < initializers.length) {
            initializers[i].initialize(this.scene);
        } else {
            this.fireDone();
        }
    }
}