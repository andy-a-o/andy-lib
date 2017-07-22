import {Group} from "../Group";
import {Rect} from "../../util/Rect";
import {DisplayObject} from "../DisplayObject";

export class ScrollableArea extends Group {
    private readonly scrollRect = new Rect(0, 0, 0, 0);
    private scrollW = 0;
    private scrollH = 0;
    private dx = 0;
    private dy = 0;

    addChild(c: DisplayObject) {
        super.addChild(c);
        this.scrollRect.includeRect(c);
        this.scrollW = Math.max(this.scrollRect.w - this.w, 0);
        this.scrollH = Math.max(this.scrollRect.h - this.h, 0);
    }

    scrollTo(position: number, vertical: boolean) {
        let dx = this.dx, dy = this.dy;
        if (vertical) {
            dy = Math.floor(this.scrollH * position);
        } else {
            dx = Math.floor(this.scrollW * position);
        }
        if ((dx != this.dx) || (dy != this.dy)) {
            this.dx = dx;
            this.dy = dy;
            this.setDirty(true);
        }
    }

    protected renderChildren(ctx: CanvasRenderingContext2D, rect: Rect) {
        const dx = this.dx;
        const dy = this.dy;
        ctx.translate(-dx, -dy);
        rect.extend(dx, dy);
        super.renderChildren(ctx, rect);
    }

    fitsContent(): boolean {
        return (this.scrollRect.w <= this.w) && (this.scrollRect.h <= this.h);
    }
}