import {SpriteSheet} from "../SpriteSheet";
import {Handle, HandleListener} from "./Handle";
import {ButtonListener} from "./Button";

export class Scale extends SpriteSheet implements ButtonListener, HandleListener {
    private handle?: Handle | undefined;
    private dragging?: boolean | undefined;

    setHandle(handle: Handle) {
        this.handle = handle;
        handle.addButtonListener(this);
        handle.addHandleListener(this);
    }

    onButtonHover() {
        this.setFrame(Math.min(1, this.frameCount - 1));
    }

    onButtonHoverOut() {
        if (!this.dragging) {
            this.setFrame(0);
        }
    }

    onBeginHandleMove() {
        this.dragging = true;
        this.setFrame(1);
    }

    onEndHandleMove() {
        this.dragging = false;
        this.setFrame(0);
    }
}