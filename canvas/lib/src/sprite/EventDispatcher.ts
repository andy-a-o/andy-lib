import {Arrays, Listeners} from "@andy-lib/util";
import {Profiler} from "@andy-lib/profiler";
import {DisplayObject} from "./DisplayObject";
import {Tooltip} from "./ui/Tooltip";
import $ from 'jquery';

const eventMap = {
    click: "onClick",
    mousemove: "onMouseMove",
    mousedown: "onMouseDown",
    mouseup: "onMouseUp"
};

let nextId = 1;
const eventHandlers = ["onClick", "onMouseMove", "onMouseOver", "onMouseOut", "onMouseDown", "onMouseUp"];

const gridSizeX = 20;
const gridSizeY = 10;

const xCoords = {};
const yCoords = {};

export interface DragListener {
    onBeginDrag?(x: number, y: number);

    onEndDrag?(x: number, y: number);

    onDrag?(x: number, y: number);
}

export interface DropTarget {
    onObjectDropped?(s: DisplayObject);
}

export interface MouseEventListener {
    onMouseDown?(x: number, y: number);

    onMouseUp?(x: number, y: number);

    onMouseOver?(x: number, y: number);

    onMouseOut?(x: number, y: number);

    onMouseMove?(x: number, y: number);

    onClick?(x: number, y: number);
}

interface DragInfo {
    startX: number;
    startY: number;
    target: DisplayObject & DragListener;
    targetX: number;
    targetY: number;
    dragState: boolean;
}

/**
 * Handles mouse events and delegates them to sprites.
 */
export class EventDispatcher {
    private readonly id: string;
    private readonly w: number;
    private readonly h: number;
    private readonly sx: number;
    private readonly sy: number;
    private attached: boolean = false;
    private defaultCursor: string = "default";
    private tooltip: Tooltip | undefined;
    private cursor: string | undefined;

    private grid: Entry[][];
    private dragInfo: DragInfo | undefined;
    private hover: MouseEventListener | undefined;
    private clickCandidate: DisplayObject | undefined;

    private readonly eventListeners = new Listeners<MouseEventListener>([
        "onMouseDown",
        "onMouseUp",
        "onClick"
    ]);

    private readonly mouseEventHandler: (event: MouseEvent) => void;
    private readonly mouseMoveEventHandler: (event: JQueryMouseEventObject) => void;
    private readonly mouseDownEventHandler: (event: JQueryMouseEventObject) => void;
    private readonly mouseUpEventHandler: (event: JQueryMouseEventObject) => void;
    private readonly clickEventHandler: (event: JQueryMouseEventObject) => void;

    constructor(private canvas: HTMLCanvasElement) {
        this.id = "dispatcher" + (nextId++);
        this.w = canvas.width;
        this.h = canvas.height;
        this.sx = Math.ceil(this.w / gridSizeX);
        this.sy = Math.ceil(this.h / gridSizeY);
        this.mouseEventHandler = this.handleMouseEvent.bind(this);
        this.mouseMoveEventHandler = this.handleMouseMoveEvent.bind(this);
        this.mouseDownEventHandler = this.handleMouseDownEvent.bind(this);
        this.mouseUpEventHandler = this.handleMouseUpEvent.bind(this);
        this.clickEventHandler = this.handleClickEvent.bind(this);
        this.initGrid();
    }

    attach() {
        console.assert(!this.attached, "Already attached");
        const c = $(this.canvas);
        const events = eventMap;
        for (let type in events) {
            if (events.hasOwnProperty(type)) {
                const handler = events[type];
                let callback;
                switch (type) {
                    case "mousedown":
                        callback = this.mouseDownEventHandler;
                        break;
                    case "mousemove":
                        callback = this.mouseMoveEventHandler;
                        break;
                    case "mouseup":
                        callback = this.mouseUpEventHandler;
                        break;
                    case "click":
                        callback = this.clickEventHandler;
                        break;
                    default:
                        callback = this.mouseEventHandler;
                        break;
                }
                c.on(`${type}.${this.id}`, {handler: handler}, callback);
            }
        }
        this.attached = true;
    }

    detach() {
        console.assert(this.attached, "Not attached");
        const c = $(this.canvas);
        const events = eventMap;
        for (let type in events) {
            if (events.hasOwnProperty(type)) {
                c.off(`${type}.${this.id}`);
            }
        }
        this.detachDragEvents();
        this.attached = false;
    }

    addSprite(s: DisplayObject) {
        xCoords[s.id] = s.x;
        yCoords[s.id] = s.y;
        this.insertIntoGrid(s);
    }

    removeSprite(s: DisplayObject) {
        const x = xCoords[s.id];
        const y = yCoords[s.id];
        if ((x === undefined) || (y === undefined)) {
            return;
        }
        this.removeFromGrid(s, x, y);
    }

    addEventListener(l: MouseEventListener) {
        this.eventListeners.add(l);
    }

    removeEventListener(l: MouseEventListener) {
        this.eventListeners.remove(l);
    }

    setDefaultCursor(cursor: string) {
        if (this.cursor != cursor) {
            this.cursor = cursor;
            this.canvas.style.cursor = cursor;
        }
        this.defaultCursor = cursor;
    }

    getDefaultCursor(): string {
        return this.defaultCursor;
    }

    setTooltip(tooltip: Tooltip) {
        this.tooltip = tooltip;
    }

    getTooltip(): Tooltip {
        return this.tooltip;
    }

    private insertIntoGrid(s: DisplayObject) {
        this.iterate(s.x, s.y, s.w, s.h, (i, j) => {
            let entry = this.grid[i][j];
            if (!entry) {
                console.dir(s);
                console.log(i + "," + j);
                throw new Error(s.toString());
            }
            entry.insert(s);
        });
    }

    private removeFromGrid(s: DisplayObject, x: number, y: number) {
        this.iterate(x, y, s.w, s.h, (i, j) => {
            let entry = this.grid[i][j];
            if (!entry) {
                console.dir(s);
                console.log(x + ", " + y);
                console.log(i + "," + j);
                throw new Error(s.toString());
            }
            entry.remove(s);
        });
    }

    private iterate(x: number, y: number, w: number, h: number, callback: (i: number, j: number) => void) {
        const left = Math.floor(Math.max(0, x) / this.sx);
        const top = Math.floor(Math.max(0, y) / this.sy);
        const right = Math.min(Math.ceil((x + w) / this.sx) - 1, gridSizeX - 1);
        const bottom = Math.min(Math.ceil((y + h) / this.sy) - 1, gridSizeY - 1);
        for (let i = left; i <= right; ++i) {
            for (let j = top; j <= bottom; ++j) {
                callback.apply(this, [i, j]);
            }
        }
    }

    private handle(x: number, y: number, handler: string) {
        const s = this.getSprite(x, y, handler);
        if (s) {
            s[handler](x, y);
        }
    }

    private handleMouseEvent(e: JQueryMouseEventObject) {
        Profiler.begin("mouse");
        this.addOffsetIfNeeded(e);
        const x = e.offsetX;
        const y = e.offsetY;
        const handler = e.data.handler;
        this.handle(x, y, handler);
        Profiler.end("mouse");
    }

    private handleMouseMoveEvent(e: JQueryMouseEventObject) {
        Profiler.begin("mousemove");
        this.addOffsetIfNeeded(e);
        const x = e.offsetX;
        const y = e.offsetY;
        const handler = e.data.handler;
        this.handle(x, y, handler);

        this.handleCursorChange(x, y);
        this.handleTooltipChange(x, y);

        // Emulate mouse over and mouse out events.
        const entries = this.getEntries(x, y);
        const s = entries["onMouseOver"].select(x, y);
        if (s && (s == this.hover)) {
            Profiler.end("mousemove");
            return;
        }
        if (s != this.hover) {
            if (this.hover && this.hover.onMouseOut) {
                this.hover.onMouseOut(x, y);
            }
            if (s && s.onMouseOver) {
                s.onMouseOver(x, y);
            }
            this.hover = s;
        }
        Profiler.end("mousemove");
    }

    private handleCursorChange(x: number, y: number) {
        const s = this.getSprite(x, y, "cursor");
        const c = (s && s.getCursor()) || this.defaultCursor;
        if (c != this.cursor) {
            this.cursor = c;
            this.canvas.style.cursor = c;
        }
    }

    private handleTooltipChange(x: number, y: number) {
        if (!this.tooltip) {
            return;
        }
        const s = this.getSprite(x, y, "tip");
        if (this.tooltip.setOwner(s)) {
            this.tooltip.adjustTo(x, y);
        }
    }

    private handleMouseDownEvent(e: JQueryMouseEventObject) {
        Profiler.begin("mousedown");
        this.addOffsetIfNeeded(e);
        const x = e.offsetX;
        const y = e.offsetY;
        const handler = e.data.handler;
        this.fireMouseDown(x, y);

        // Remember sprite for the latter use in handleClickEvent.
        const entries = this.getEntries(x, y);
        this.clickCandidate = entries["onClick"].select(x, y);

        const s = entries[handler].select(x, y);
        if (s) {
            Profiler.begin(handler);
            s[handler](x, y);
            Profiler.end(handler);
        }

        // Emulate drag"n"drop
        const draggable = entries["draggable"].select(x, y) as DisplayObject & DragListener;
        if (draggable && draggable.isDraggable()) {
            if (draggable.getDragOptions() != DisplayObject.DRAGGABLE_NONE) {
                this.beginDrag(draggable, x, y);
            }
        }

        Profiler.end("mousedown");
    }

    private handleMouseUpEvent(e: JQueryMouseEventObject) {
        Profiler.begin("mouseup");
        this.addOffsetIfNeeded(e);
        const x = e.offsetX;
        const y = e.offsetY;
        const handler = e.data.handler;
        this.fireMouseUp(x, y);
        this.handle(x, y, handler);
        Profiler.end("mouseup");
    }

    private handleClickEvent(e: JQueryMouseEventObject) {
        Profiler.begin("click");
        this.addOffsetIfNeeded(e);
        const x = e.offsetX;
        const y = e.offsetY;
        const handler = e.data.handler;
        this.fireClick(x, y);
        const s = this.getSprite(x, y, handler);
        if (s && (s == this.clickCandidate)) {
            s[handler](x, y);
        }
        delete this.clickCandidate;
        Profiler.end("click");
    }

    private getSprite(x: number, y: number, handler: string) {
        const entry = this.getEntries(x, y);
        return entry[handler].select(x, y);
    }

    private getEntries(x: number, y: number): Entry {
        const i = Math.floor(x / this.sx);
        const j = Math.floor(y / this.sy);
        if ((i < 0) || (i >= gridSizeX) || (j < 0) || (j >= gridSizeY)) {
            return null;
        }
        return this.grid[i][j] || Entry.empty;
    }

    private initGrid() {
        this.grid = [];
        for (let i = 0; i < gridSizeX; ++i) {
            const col = [];
            for (let j = 0; j < gridSizeY; ++j) {
                col.push(new Entry(i, j));
            }
            this.grid.push(col);
        }
    }

    private attachDragEvents() {
        const doc = $(document);
        doc.on(`mousemove.${this.id}`, this.onDocumentMouseMove.bind(this));
        doc.on(`mouseup.${this.id}`, this.onDocumentMouseUp.bind(this));
    }

    private detachDragEvents() {
        const doc = $(document);
        doc.off(`mousemove.${this.id}`);
        doc.off(`mouseup.${this.id}`);
    }

    private onDocumentMouseMove(e: JQueryMouseEventObject) {
        if (this.dragInfo) {
            this.addOffsetIfNeeded(e);
            const info = this.dragInfo;
            const target = info.target;
            const flags = target.getDragOptions();
            const x = info.startX;
            const y = info.startY;
            const dx = (e.offsetX - x) * ((flags & DisplayObject.DRAGGABLE_H) ? 1 : 0);
            const dy = (e.offsetY - y) * ((flags & DisplayObject.DRAGGABLE_V) ? 1 : 0);
            this.doDrag(info, target, x + dx, y + dy);
        }
    }

    private onDocumentMouseUp(e: JQueryMouseEventObject) {
        this.addOffsetIfNeeded(e);
        const x = e.offsetX;
        const y = e.offsetY;
        this.endDrag(x, y);
    }

    private beginDrag(s: DisplayObject & DragListener, x: number, y: number) {
        this.dragInfo = {
            startX: x,
            startY: y,
            target: s,
            targetX: s.x,
            targetY: s.y,
            dragState: true
        };
        if (s.onBeginDrag) {
            s.onBeginDrag(x, y);
        }
        this.attachDragEvents();
    }

    private doDrag(info, target: DisplayObject & DragListener, x, y) {
        const newX = info.targetX + x - info.startX;
        const newY = info.targetY + y - info.startY;
        target.move(
            Math.max(Math.min(newX, this.w - target.w), 0),
            Math.max(Math.min(newY, this.h - target.h), 0));
        if (target.onDrag) {
            target.onDrag(x, y);
        }
    }

    private endDrag(x: number, y: number) {
        if (this.dragInfo) {
            const s = this.dragInfo.target;
            const targetX = this.dragInfo.targetX;
            const targetY = this.dragInfo.targetY;
            delete this.dragInfo;
            this.removeFromGrid(s, targetX, targetY);
            this.insertIntoGrid(s);
            if (s.onEndDrag) {
                s.onEndDrag(x, y);
            }
            this.detachDragEvents();
            const dropTarget = this.getSprite(x, y, "droppable");
            if (dropTarget) {
                dropTarget.onObjectDropped(s);
            }
        }
    }

    private isDragging(s: DisplayObject): boolean {
        return (this.dragInfo && (s.id === this.dragInfo.target.id));
    }

    private fireMouseUp(x: number, y: number) {
        this.eventListeners.call("onMouseUp", [x, y]);
    }

    private fireMouseDown(x: number, y: number) {
        this.eventListeners.call("onMouseDown", [x, y]);
    }

    private fireClick(x: number, y: number) {
        this.eventListeners.call("onClick", [x, y]);
    }

    private addOffsetIfNeeded(event: JQueryMouseEventObject) {
        const elem = this.canvas;
        if ((event.offsetX !== undefined) && (event.offsetY !== undefined) && (event.target === elem)) {
            return;
        }
        const doc = elem.ownerDocument;
        const docElem = doc.documentElement;
        const body = doc.body;
        let boxTop = 0, boxLeft = 0;
        if (typeof elem.getBoundingClientRect !== "undefined") {
            const boundingRect = elem.getBoundingClientRect();
            boxLeft = boundingRect.left;
            boxTop = boundingRect.top;
        }
        const win = elem["defaultView"] || elem["parentWindow"] || false;
        const clientTop = docElem.clientTop || body.clientTop || 0;
        const clientLeft = docElem.clientLeft || body.clientLeft || 0;
        const scrollTop = win.pageYOffset || docElem.scrollTop;
        const scrollLeft = win.pageXOffset || docElem.scrollLeft;
        event.offsetX = Math.min(event.pageX - (boxLeft + scrollLeft - clientLeft), this.w - 1);
        event.offsetY = Math.min(event.pageY - (boxTop + scrollTop - clientTop), this.h - 1);
    }
}

class Entry {
    private readonly draggable = new OrderedSprites();
    private readonly droppable = new OrderedSprites();
    private readonly cursor = new OrderedSprites();
    private readonly tip = new OrderedSprites();

    public static readonly empty = new Entry(-1, -1);

    constructor(private i: number, private j: number) {
        for (let k = 0, n = eventHandlers.length; k < n; ++k) {
            const m = eventHandlers[k];
            this[m] = new OrderedSprites();
        }
    }

    insert(s: DisplayObject & DragListener & MouseEventListener & DropTarget) {
        for (let k = 0, n = eventHandlers.length; k < n; ++k) {
            const m = eventHandlers[k];
            if (s[m]) {
                this[m].insert(s);
            }
        }
        if (s.isDraggable()) {
            this.draggable.insert(s);
        }
        if (s.onObjectDropped) {
            this.droppable.insert(s);
        }
        if (s.getCursor()) {
            this.cursor.insert(s);
        }
        if (s.getTip()) {
            this.tip.insert(s);
        }
    }

    remove(s: DisplayObject & DragListener & MouseEventListener & DropTarget) {
        for (let k = 0, n = eventHandlers.length; k < n; ++k) {
            const m = eventHandlers[k];
            if (s[m]) {
                this[m].remove(s);
            }
        }
        if (s.isDraggable()) {
            this.draggable.remove(s);
        }
        if (s.onObjectDropped) {
            this.droppable.remove(s);
        }
        if (s.getCursor()) {
            this.cursor.remove(s);
        }
        if (s.getTip()) {
            this.tip.remove(s);
        }
    }
}

class OrderedSprites {
    private readonly spriteMap: DisplayObject[] = [];

    insert(s: DisplayObject) {
        const sprites = this.spriteMap;
        if (sprites.indexOf(s) >= 0) {
            return;
        }
        if (sprites.length > 0) {
            const z1 = getZIndex(s);
            for (let i = 0, n = sprites.length; i < n; ++i) {
                const z2 = getZIndex(sprites[i]);
                if (Arrays.compare(z1, z2) >= 0) {
                    sprites.splice(i, 0, s);
                    return;
                }
            }
        }
        sprites.push(s);
    }

    select(x: number, y: number) {
        const sprites = this.spriteMap;
        for (let k = 0, n = sprites.length; k < n; ++k) {
            const s = sprites[k];
            if (s.mouseCheck(x, y)) {
                return s;
            }
        }
        return null;
    }

    remove(s: DisplayObject) {
        Arrays.remove(this.spriteMap, s);
        clearZIndexCache(s);
    }
}

const zIndexCache: { [id: string]: number[] } = {};

function getZIndex(s: DisplayObject): number[] {
    let z = zIndexCache[s.id];
    if (!z) {
        z = zIndexCache[s.id] = buildZIndex(s);
    }
    return z;
}

function buildZIndex(s: DisplayObject): number[] {
    let z = [];
    do {
        z.unshift(s.z);
        s = s.getParent();
    } while (s);
    return z;
}

function clearZIndexCache(s: DisplayObject) {
    delete zIndexCache[s.id];
}