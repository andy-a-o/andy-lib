import {SceneInitializer} from "./SceneInitializer";
import {DisplayObject, DisplayObjectListener} from "../sprite/DisplayObject";
import {Scene} from "./Scene";
import {StageListener} from "../sprite/Stage";

export class SpriteInitializer<T extends DisplayObject> extends SceneInitializer implements DisplayObjectListener, StageListener {
    private waitForRemove?: boolean | undefined;
    private onlyOnce?: boolean | undefined;
    private wasInitialized?: boolean | undefined;

    constructor(private readonly sprite: T, private removeOnStop?: boolean) {
        super();
    }

    setRemoveOnStop(remove: boolean) {
        this.removeOnStop = remove;
    }

    setWaitForRemove(wait: boolean) {
        this.waitForRemove = wait;
    }

    setOnlyOnce(once: boolean) {
        this.onlyOnce = once;
    }

    getSprite(): T {
        return this.sprite;
    }

    initialize(scene: Scene<any, any>) {
        if (this.wasInitialized && this.onlyOnce) {
            this.fireDone();
            return;
        }
        if (this.removeOnStop) {
            scene.getStage().addStageListener(this);
        }
        if (this.waitForRemove) {
            this.sprite.addObjectListener(this);
        } else {
            this.sprite.removeObjectListener(this);
        }
        this.sprite.show();
        scene.getStage().add(this.sprite);
        if (!this.waitForRemove) {
            this.fireDone();
        }
    }

    onObjectRemoved() {
        if (this.waitForRemove) {
            this.fireDone();
        }
    }

    onStageStopped() {
        this.sprite.remove();
    }

    protected fireDone() {
        super.fireDone();
        this.wasInitialized = true;
    }
}