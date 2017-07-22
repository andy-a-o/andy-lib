import {DisplayObject, DisplayObjectListener} from "./DisplayObject";
import {RenderObject, RenderObjectConfig} from "./RenderObject";
import {Rect} from "../util/Rect";

export interface GroupConfig extends RenderObjectConfig {
}

/**
 * A Group is a Container that only contains another DisplayObject,
 * and renders them on the canvas.
 */
export class Group extends RenderObject {
    private readonly changeRect: Rect;
    private readonly originalRect: Rect;
    private readonly changedChildren: DisplayObject[] = [];
    private readonly childrenListener: DisplayObjectListener;

    constructor(res: GroupConfig) {
        super(res);
        this.changeRect = this.clone();
        this.originalRect = this.clone();
        this.changedChildren = [];
        const group = this;
        this.childrenListener = {
            onObjectVisibilityChanged(c: DisplayObject) {
                group.markAsChanged(c, true);
            },
            onObjectAdded(c: DisplayObject) {
                group.markAsChanged(c, true);
            },
            onObjectRemoved(c: DisplayObject) {
                group.markAsChanged(c, true);
            },
            onObjectUpdated(c: DisplayObject) {
                group.markAsChanged(c, false);
            },
            onChildAdded(parent: DisplayObject, child: DisplayObject) {
                group.registerChild(child);
            },
            onChildRemoved(parent: DisplayObject, child: DisplayObject) {
                group.unregisterChild(child);
            }
        };
    }

    setDirty(dirty: boolean, partial?: boolean) {
        super.setDirty(dirty);
        if (!partial) {
            this.changeRect.includeRect(this.originalRect);
        }
    }

    addChild(c: DisplayObject) {
        super.addChild(c);
        this.registerChild(c);
    }

    removeChild(c: DisplayObject) {
        super.removeChild(c);
        this.unregisterChild(c);
    }

    protected clearState(ctx: CanvasRenderingContext2D) {
        // Do nothing here
    }

    protected render(ctx: CanvasRenderingContext2D) {
        const rect = this.changeRect;
        const children = this.changedChildren;
        for (let i = 0, n = children.length; i < n; ++i) {
            children[i].update(rect);
        }
        const origin = this.originalRect;
        ctx.clearRect(rect.x - origin.x, rect.y - origin.y, rect.w, rect.h);
        this.renderChildren(ctx, rect);
    }

    protected includeUpdatedRegion(rect: Rect) {
        const change = this.changeRect;
        if (!change.isEmpty()) {
            change.intersect(this);
            const origin = this.originalRect;
            const dx = this.x - origin.x;
            const dy = this.y - origin.y;
            rect.include(change.x + dx, change.y + dy, change.w, change.h);
        }
    }

    protected saveState() {
        super.saveState();
        this.changedChildren.length = 0;
        this.changeRect.reset(0, 0, 0, 0);
    }

    protected updateChildren(rect: Rect) {
        // Do nothing, all done in render!
    }

    protected drawChildren(ctx: CanvasRenderingContext2D, rect: Rect) {
        // All children are already drawn in the update method.
    }

    protected shiftChildren(dx: number, dy: number) {
        // Don't move children when group is moving!
    }

    protected renderChildren(ctx: CanvasRenderingContext2D, rect: Rect) {
        const children = this.getChildren();
        for (let i = 0, n = children.length; i < n; ++i) {
            this.renderChild(ctx, children[i], rect);
        }
    }

    protected renderChild(ctx: CanvasRenderingContext2D, c: DisplayObject, rect: Rect) {
        const src = this.srcRect;
        const dst = this.dstRect;
        const origin = this.originalRect;
        src.resetFrom(rect).intersect(c);
        if (!src.isEmpty()) {
            if (c.isVisible()) {
                dst.resetFrom(src);
                src.shift(-c.x, -c.y);
                dst.shift(-origin.x, -origin.y);
                c.drawRect(ctx, src, dst);
                if (!(c instanceof Group)) {
                    const children = c.getChildren();
                    for (let i = 0, n = children.length; i < n; ++i) {
                        this.renderChild(ctx, children[i], rect);
                    }
                }
            }
        }
    }

    private markAsChanged(c: DisplayObject, forceInclude: boolean) {
        this.changedChildren.push(c);
        this.setDirty(true, true);
        if (forceInclude) {
            this.changeRect.includeRect(c);
        }
    }

    private registerChild(c: DisplayObject) {
        this.markAsChanged(c, true);
        c.addObjectListener(this.childrenListener);
        if (!(c instanceof Group)) {
            const children = c.getChildren();
            for (let i = 0, n = children.length; i < n; ++i) {
                this.registerChild(children[i]);
            }
        }
    }

    private unregisterChild(c: DisplayObject) {
        this.markAsChanged(c, true);
        c.removeObjectListener(this.childrenListener);
        if (!(c instanceof Group)) {
            const children = c.getChildren();
            for (let i = 0, n = children.length; i < n; ++i) {
                this.unregisterChild(children[i]);
            }
        }
    }

    updateCoords() {
        const origin = this.originalRect;
        const dx = this.x - origin.x;
        const dy = this.y - origin.y;
        this.originalRect.shift(dx, dy);
        super.shiftChildren(dx, dy);
        super.updateCoords();
    }

    protected getOriginalRect(): Rect {
        return this.originalRect;
    }

    toJSON(): any {
        return {
            ...super.toJSON(),
            srcRect: this.srcRect,
            dstRect: this.dstRect,
            changeRect: this.changeRect,
            originalRect: this.originalRect,
            changedChildren: this.changedChildren
        };
    }
}