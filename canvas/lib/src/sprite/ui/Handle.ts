import {Button, ButtonConfig} from "./Button";
import {DisplayObject} from "../DisplayObject";
import {DragListener} from "../EventDispatcher";
import {Listeners} from "@andy-lib/util";
import {Rect} from "../../util/Rect";

export interface HandleListener {
    onBeginHandleMove?(handle: Handle);

    onEndHandleMove?(handle: Handle);

    onHandlePositionChanged?(handle: Handle);
}

export interface HandleConfig extends ButtonConfig {
    maxx?: number | undefined;
    maxy?: number | undefined;
}

export class Handle extends Button implements DragListener {
    private readonly handleListeners = new Listeners<HandleListener>([
        "onBeginHandleMove",
        "onEndHandleMove",
        "onHandlePositionChanged"
    ]);

    readonly minX?: number | undefined;
    readonly minY?: number | undefined;
    readonly maxX?: number | undefined;
    readonly maxY?: number | undefined;

    private dragging?: boolean | undefined;
    private steps?: number | undefined;
    private dx?: number | undefined;
    private dy?: number | undefined;

    constructor(res: HandleConfig) {
        super(res);
        this.setDraggable(true);
        if (res.maxx !== undefined) {
            this.setDragOptions(DisplayObject.DRAGGABLE_H);
        }
        if (res.maxx !== undefined) {
            this.setDragOptions(DisplayObject.DRAGGABLE_V);
        }
        this.minX = res.x;
        this.minY = res.y;
        this.maxX = res.maxx;
        this.maxY = res.maxy;
    }

    onBeginDrag() {
        this.dragging = true;
        this.fireBeginMove();
    }

    onEndDrag(x: number, y: number) {
        this.dragging = false;
        if (!this.mouseCheck(x, y)) {
            this.setFrame(0);
        }
        this.fireEndMove();
    }

    update(rect: Rect) {
        if (this.dragging) {
            this.setFrame(Math.min(1, this.frameCount - 1));
        }
        super.update(rect);
    }

    addHandleListener(l: HandleListener) {
        this.handleListeners.add(l);
    }

    setSteps(steps: number) {
        this.steps = steps;
        if (this.minX && this.maxX) {
            this.dx = Math.floor((this.maxX - this.minX) / steps);
        }
        if (this.minY && this.maxY) {
            this.dy = Math.floor((this.maxY - this.minY) / steps);
        }
    }

    /**
     * @param position 0 to 1.
     */
    setPosition(position: number) {
        this.remove();
        let x = this.x, y = this.y;
        if (this.getDragOptions() == DisplayObject.DRAGGABLE_V) {
            y = this.minY + Math.floor((this.maxY - this.minY) * position);
        } else {
            x = this.minX + Math.floor((this.maxX - this.minX) * position);
        }
        this.move(x, y);
        this.add();
        this.firePositionChanged();
    }

    /**
     * @return 0 to 1.
     */
    getPosition(): number {
        if (this.getDragOptions() == DisplayObject.DRAGGABLE_V) {
            return (this.y - this.minY) / (this.maxY - this.minY);
        } else {
            return (this.x - this.minX) / (this.maxX - this.minX);
        }
    }

    move(x: number, y: number) {
        if (this.dx) {
            x = this.minX + Math.round((x - this.minX) / (this.maxX - this.minX) * this.steps) * this.dx;
            if ((this.maxX - x) < this.dx) {
                x = this.maxX;
            }
        }
        if (this.dy) {
            y = this.minY + Math.round((y - this.minY) / (this.maxY - this.minY) * this.steps) * this.dy;
        }
        if (x < this.minX) {
            x = this.minX;
        }
        if (this.maxX && (x > this.maxX)) {
            x = this.maxX;
        }
        if (y < this.minY) {
            y = this.minY;
        }
        if (this.maxY && (y > this.maxY)) {
            y = this.maxY;
        }
        if ((x != this.x) || (y != this.y)) {
            super.move(x, y);
            this.firePositionChanged();
        }
        return this;
    }

    private fireBeginMove() {
        this.handleListeners.call("onBeginHandleMove", [this]);
    }

    private fireEndMove() {
        this.handleListeners.call("onEndHandleMove", [this]);
    }

    private firePositionChanged() {
        this.handleListeners.call("onHandlePositionChanged", [this]);
    }
}