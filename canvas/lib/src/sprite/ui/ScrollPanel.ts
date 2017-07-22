import {DisplayObject, DisplayObjectConfig} from "../DisplayObject";
import {ScrollableArea} from "./ScrollableArea";
import {Handle, HandleConfig, HandleListener} from "./Handle";

export class ScrollPanel extends DisplayObject implements HandleListener {
    private readonly scrollableArea: ScrollableArea;
    protected handle?: Handle | undefined;

    constructor(res: DisplayObjectConfig) {
        super(res);
        this.addChild(this.scrollableArea = new ScrollableArea({x: this.x, y: this.y, w: this.w, h: this.h}));
    }

    getScrollableArea(): ScrollableArea {
        return this.scrollableArea;
    }

    addHandle(res: HandleConfig) {
        const handle = new Handle(res);
        handle.addHandleListener(this);
        this.addChild(handle);
        this.handle = handle;
        this.contentUpdated();
        return handle;
    }

    clearScrollContent() {
        this.scrollableArea.removeAllChildren();
        this.contentUpdated();
    }

    addScrollContent(sprite: DisplayObject) {
        this.scrollableArea.addChild(sprite);
        this.contentUpdated();
    }

    onHandlePositionChanged(handle: Handle) {
        const pos = handle.getPosition();
        const opts = handle.getDragOptions();
        this.scrollableArea.scrollTo(pos, (opts & DisplayObject.DRAGGABLE_V) !== 0);
    }

    onEndHandleMove() {
        this.scrollableArea.updateCoords();
    }

    protected getImageData(x: number, y: number): Uint8ClampedArray | null {
        return null;
    }

    private contentUpdated() {
        this.handle && this.handle.setEnabled(!this.scrollableArea.fitsContent());
    }
}