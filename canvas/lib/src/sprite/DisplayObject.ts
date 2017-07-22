import {Rect} from "../util/Rect";
import {Listeners} from "@andy-lib/util";
import {FilterFactory, FilterType} from "./filter/FilterFactory";
import {AbstractFilter} from "./filter/AbstractFilter";
import {Sprites} from "../util/Sprites";
import {Stage} from "./Stage";

export type CompositionType = "source-over" | "source-in" | "source-out" | "source-atop" | "lighter"
    | "xor" | "destination-over" | "destination-in" | "destination-out" | "destination-atop"
    | "darker";

export interface DisplayObjectListener {
    onObjectVisibilityChanged?(object: DisplayObject);

    onObjectAbilityChanged?(object: DisplayObject);

    onObjectDraggableChanged?(object: DisplayObject);

    onObjectAdded?(object: DisplayObject, stage: Stage);

    onObjectRemoved?(object: DisplayObject, stage: Stage);

    onObjectUpdated?(object: DisplayObject);

    onChildAdded?(object: DisplayObject, child: DisplayObject);

    onChildRemoved?(object: DisplayObject, child: DisplayObject);
}

export interface DisplayObjectTooltipConfig {
    text: string;
    delay?: number;
    dynamic?: boolean;
}

export interface OffsetConfig {
    x?: number | undefined;
    y?: number | undefined;
    r?: number | undefined;
    b?: number | undefined;
}

export interface DisplayObjectConfig {
    x: number;
    y: number;
    w: number;
    h: number;
    offset?: OffsetConfig | undefined;
    id?: number | undefined;
    z?: number | undefined;
    scale?: number | undefined;
    tip?: string | DisplayObjectTooltipConfig | undefined;
    cursor?: string | undefined;
    alphaThreshold?: number | undefined;
    canvasId?: string | undefined;
    composition?: CompositionType | undefined;
    filters?: { [name: string]: any } | undefined;
}

/**
 * Abstract displayable rectangular object having x and y coords.
 * Each display object has the following lifecycle:
 * <ul>
 *     <li>create</li>
 *     <li>update (in loop)</li>
 *     <li>draw (in loop)</li>
 * </ul>
 */
export abstract class DisplayObject extends Rect {
    private readonly objectListeners = new Listeners<DisplayObjectListener>([
        "onObjectVisibilityChanged",
        "onObjectAbilityChanged",
        "onObjectDraggableChanged",
        "onObjectAdded",
        "onObjectRemoved",
        "onObjectUpdated",
        "onChildAdded",
        "onChildRemoved"
    ]);

    id: number;
    z: number;

    private scale: number | undefined;
    private cursor: string | undefined;
    private canvasId: string | undefined;

    private stage: Stage | undefined;

    private tip: string | undefined;
    private tipDelay: number | undefined;
    private tipDynamic: boolean | undefined;

    private filters: AbstractFilter[] | undefined;
    private children: DisplayObject[] | undefined;
    private parent: DisplayObject | undefined;

    private enabled: boolean = true;
    private visible: boolean = true;
    private dirty: boolean = true;

    private draggable: boolean | undefined;
    private dragOptions: number | undefined;

    private canMove: boolean | undefined;
    protected readonly srcRect = new Rect(0, 0, 0, 0);
    protected readonly dstRect = new Rect(0, 0, 0, 0);

    private alphaThreshold: number | undefined;
    private compositionType: string | undefined;

    private xDrawn: number | undefined;
    private yDrawn: number | undefined;

    constructor(res: DisplayObjectConfig) {
        super(res.x, res.y, res.w, res.h);

        this.id = res.id || DisplayObject.nextId++;
        this.z = res.z || DisplayObject.nextZIndex++;

        res.scale && (this.scale = res.scale);
        res.cursor && (this.cursor = res.cursor);

        if (res.tip) {
            if (typeof res.tip == "object") {
                const tooltip = <DisplayObjectTooltipConfig>res.tip;
                this.tip = tooltip.text;
                if (tooltip.delay) {
                    this.tipDelay = tooltip.delay;
                }
                if (tooltip.dynamic) {
                    this.tipDynamic = true;
                }
            } else {
                this.tip = <string>res.tip;
            }
        }

        res.alphaThreshold && (this.alphaThreshold = res.alphaThreshold);
        res.canvasId && (this.canvasId = res.canvasId);
        res.composition && (this.compositionType = res.composition);

        const filters = res.filters;
        if (filters) {
            const filterFactory = new FilterFactory();
            this.filters = [];
            for (let key in filters) {
                this.filters.push(filterFactory.newFilter(<FilterType>key, filters[key]));
            }
        }
    }

    getId(): number {
        return this.id;
    }

    getCanvasId(): string | undefined {
        return this.canvasId;
    }

    getCompositionType(): string {
        return this.compositionType || "source-over";
    }

    getCursor(): string | undefined {
        return this.cursor;
    }

    getTip(): string | undefined {
        return this.tip;
    }

    /**
     * @return Number of milliseconds to display tip.
     */
    getTipDelay(): number | undefined {
        return this.tipDelay;
    }

    isTipDynamic(): boolean {
        return !!this.tipDynamic;
    }

    /**
     * @return Tooltip text parameters.
     */
    getTipParams(): any | undefined {
        return undefined;
    }

    getStage(): Stage | undefined {
        return this.stage;
    }

    addObjectListener(l: DisplayObjectListener) {
        this.objectListeners.add(l);
    }

    removeObjectListener(l: DisplayObjectListener) {
        this.objectListeners.remove(l);
    }

    setDraggable(draggable: boolean) {
        if (this.draggable !== draggable) {
            this.draggable = draggable;
            if (draggable) {
                this.canMove = true;
            }
            this.fireDraggableChanged();
        }
    }

    isDraggable(): boolean {
        return !!this.draggable;
    }

    /**
     * @param dragOptions Any combination of <code>DisplayObject.DRAGGABLE_XXX</code> flags.
     */
    setDragOptions(dragOptions: number) {
        this.dragOptions = dragOptions;
    }

    /**
     * @return Any combination of <code>DisplayObject.DRAGGABLE_XXX</code> flags.
     */
    getDragOptions() {
        return this.dragOptions || DisplayObject.DRAGGABLE_NONE;
    }

    setCanMove(canMove: boolean) {
        this.canMove = canMove;
    }

    isCanMove(): boolean {
        return this.canMove;
    }

    /**
     * @returns 0..100
     */
    getScale(): number {
        return this.scale;
    }

    /**
     * @param scale 0..100
     */
    setScale(scale: number) {
        if (this.scale != scale) {
            this.scale = scale;
            this.dirty = true;
        }
    }

    getParent(): DisplayObject | undefined {
        return this.parent;
    }

    addChild(c: DisplayObject) {
        console.assert(c instanceof DisplayObject);
        if (!this.children) {
            this.children = [];
        } else {
            this.children = this.children.slice(); // copy on write
        }
        const children = this.children;
        if (children.indexOf(c) >= 0) {
            return;
        }
        Sprites.insertSpriteIntoZIndexOrderedArray(children, c);
        c.parent = this;
        c.canvasId = this.canvasId;
        if (this.stage) {
            c.onAdded(this.stage);
        }
        this.fireChildAdded(c);
    }

    removeChild(c: DisplayObject) {
        if (!this.children) {
            return;
        }
        this.children = this.children.slice(); // copy on write
        const i = this.children.indexOf(c);
        if (i >= 0) {
            this.children.splice(i, 1);
            if (this.stage) {
                c.onRemoved(this.stage);
            }
            this.fireChildRemoved(c);
        }
    }

    getChildren(): DisplayObject[] | undefined {
        return this.children;
    }

    removeAllChildren() {
        if (!this.children) {
            return;
        }
        const children = this.children.slice();
        for (let i = 0, n = children.length; i < n; ++i) {
            this.removeChild(children[i]);
        }
    }

    addFilter(filter: AbstractFilter) {
        if (!this.filters) {
            this.filters = [];
        }
        const i = this.filters.indexOf(filter);
        if (i < 0) {
            this.filters.push(filter);
            this.dirty = true;
        }
    }

    removeFilter(filter: AbstractFilter) {
        if (!this.filters) {
            return;
        }
        const i = this.filters.indexOf(filter);
        if (i >= 0) {
            this.filters.splice(i, 1);
            this.dirty = true;
        }
    }

    getFilters(): AbstractFilter[] {
        return this.filters || [];
    }

    clearFilters() {
        if (!this.filters) {
            return;
        }
        if (this.filters.length > 0) {
            this.filters.length = 0;
            this.dirty = true;
        }
    }

    setEnabled(enabled: boolean) {
        if (this.enabled == enabled) {
            return;
        }
        const children = this.children;
        if (children) {
            for (let i = 0, n = children.length; i < n; ++i) {
                children[i].setEnabled(enabled);
            }
        }
        this.enabled = enabled;
        this.fireAbilityChanged();
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    enable() {
        this.setEnabled(true);
    }

    disable() {
        this.setEnabled(false);
    }

    setVisible(visible: boolean) {
        if (this.visible == visible) {
            return;
        }
        const children = this.children;
        if (children) {
            for (let i = 0, n = children.length; i < n; ++i) {
                children[i].setVisible(visible);
            }
        }
        this.visible = visible;
        this.fireVisibilityChanged();
    }

    isVisible(): boolean {
        return this.visible;
    }

    show() {
        this.setVisible(true);
    }

    hide() {
        this.setVisible(false);
    }

    /**
     * @param rect Area that will be redrawn.
     */
    update(rect: Rect) {
        if (this.isStateChanged()) {
            this.updateState();
            this.includeUpdatedRegion(rect);
            this.saveState();
        }
        this.updateChildren(rect);
        if (this.canMove && this.visible) {
            if ((this.xDrawn !== undefined) && (this.yDrawn !== undefined)) {
                if ((this.xDrawn !== this.x) || (this.yDrawn !== this.y)) {
                    rect.includeRect(this);
                    rect.include(this.xDrawn, this.yDrawn, this.w, this.h);
                }
            }
        }
    }

    protected includeUpdatedRegion(rect: Rect) {
        rect.includeRect(this);
    }

    /**
     * @param rect Area that will be redrawn.
     */
    protected updateChildren(rect) {
        if (!this.children) {
            return;
        }
        const children = this.children;
        for (let i = 0, n = children.length; i < n; ++i) {
            children[i].update(rect);
        }
    }

    protected updateState() {
        // Stub
    }

    /**
     * @param ctx 2D drawing context.
     * @param rect Area of the stage to be redrawn..
     */
    draw(ctx: CanvasRenderingContext2D, rect: Rect) {
        const dst = this.dstRect.resetFrom(rect).intersect(this);
        if (!dst.isEmpty()) {
            const src = this.srcRect.resetFrom(dst).shift(-this.x, -this.y);
            if (this.visible) {
                this.drawRect(ctx, src, dst);
            }
            if (this.canMove) {
                this.xDrawn = this.x;
                this.yDrawn = this.y;
            }
        }
        this.drawChildren(ctx, rect);
    }

    /**
     * @param ctx 2D drawing context.
     * @param src Source rect.
     * @param dst Destination rect.
     */
    drawRect(ctx: CanvasRenderingContext2D, src: Rect, dst: Rect) {
        if (this.compositionType) {
            ctx.globalCompositeOperation = this.compositionType;
        }
    }

    protected drawChildren(ctx, rect) {
        if (!this.children) {
            return;
        }
        const children = this.children;
        for (let i = 0, n = children.length; i < n; ++i) {
            children[i].draw(ctx, rect);
        }
    }

    protected saveState() {
        this.dirty = false;
    }

    /**
     * @return whether the display object has been updated since the last <code>draw()</code>.
     */
    protected isStateChanged() {
        return this.dirty;
    }

    /**
     * Sets whether the display object is dirty
     * and must be redrawn. Fires <code>onObjectUpdated</code>
     * event.
     */
    protected setDirty(dirty: boolean) {
        if (this.dirty != dirty) {
            this.dirty = dirty;
            this.fireObjectUpdated();
        }
    }

    /**
     * Checks if this object is targeted by cursor.
     *
     * @param x cursor x-coord.
     * @param y cursor y-coord.
     * @return Whether the display object is under cursor.
     */
    mouseCheck(x: number, y: number): boolean {
        if (!this.contains(x, y)) {
            return false;
        }
        if (this.alphaThreshold !== undefined) {
            const imageData = this.getImageData(x, y);
            if (!imageData) {
                console.warn("No image data found at " + x + "," + y);
                console.dir(this);
                return false;
            }
            const alpha = imageData[3];
            if (alpha <= this.alphaThreshold) {
                return false;
            }
        }
        return true;
    }

    updateCoords() {
        const stage = this.getStage();
        stage && stage.updateCoords(this);
        const children = this.children;
        if (children) {
            for (let i = 0, n = children.length; i < n; ++i) {
                children[i].updateCoords();
            }
        }
    }

    protected getImageData(x: number, y: number): Uint8ClampedArray | null {
        return null;
    }

    /**
     * Called when this display object is added to the stage.
     */
    onAdded(stage: Stage) {
        this.stage = stage;
        const children = this.children;
        if (children) {
            for (let i = 0, n = children.length; i < n; ++i) {
                children[i].onAdded(stage);
            }
        }
        this.fireObjectAdded(stage);
    }

    /**
     * Called when this display object is removed from stage.
     */
    onRemoved(stage: Stage) {
        const children = this.children;
        if (children) {
            for (let i = 0, n = children.length; i < n; ++i) {
                children[i].onRemoved(stage);
            }
        }
        this.fireObjectRemoved(stage);
    }

    add() {
        if (this.parent) {
            this.parent.addChild(this);
        } else if (this.stage) {
            this.stage.add(this);
        }
    }

    remove() {
        if (this.parent) {
            this.parent.removeChild(this);
        } else if (this.stage) {
            this.stage.remove(this);
        }
    }

    move(x: number, y: number): Rect {
        this.shiftChildren(x - this.x, y - this.y);
        return super.move(x, y);
    }

    shift(dx: number, dy: number): Rect {
        this.shiftChildren(dx, dy);
        return super.shift(dx, dy);
    }

    protected shiftChildren(dx: number, dy: number) {
        const children = this.children;
        if (children) {
            for (let i = 0, n = children.length; i < n; ++i) {
                children[i].shift(dx, dy);
            }
        }
    }

    toJSON(): any {
        const o = {
            ...super.toJSON(),
            z: this.z,
            id: this.id,
            type: this.constructor["name"],
            visible: this.visible,
            enabled: this.enabled,
            dirty: this.dirty,
            scale: this.scale,
            canMove: this.canMove,
            draggable: this.draggable
        };
        const children = this.getChildren();
        if (children.length > 0) {
            o.children = new Array(children.length);
            for (let i = 0, n = children.length; i < n; ++i) {
                o.children[i] = children[i].toJSON();
            }
        }
        return o;
    }

    private fireVisibilityChanged() {
        this.objectListeners.call("onObjectVisibilityChanged", [this]);
    }

    private fireAbilityChanged() {
        this.objectListeners.call("onObjectAbilityChanged", [this]);
    }

    private fireDraggableChanged() {
        this.objectListeners.call("onObjectDraggableChanged", [this]);
    }

    private fireObjectAdded(stage: Stage) {
        this.objectListeners.call("onObjectAdded", [this, stage]);
    }

    private fireObjectRemoved(stage: Stage) {
        this.objectListeners.call("onObjectRemoved", [this, stage]);
    }

    private fireObjectUpdated() {
        this.objectListeners.call("onObjectUpdated", [this]);
    }

    private fireChildAdded(c: DisplayObject) {
        this.objectListeners.call("onChildAdded", [this, c]);
    }

    private fireChildRemoved(c: DisplayObject) {
        this.objectListeners.call("onChildRemoved", [this, c]);
    }

    private static nextId: number = 1;
    private static nextZIndex: number = 1;

    static readonly DRAGGABLE_NONE = 0x0;
    static readonly DRAGGABLE_V = 0x1;
    static readonly DRAGGABLE_H = 0x2;
    static readonly DRAGGABLE_ALL = (DisplayObject.DRAGGABLE_V | DisplayObject.DRAGGABLE_H);
}