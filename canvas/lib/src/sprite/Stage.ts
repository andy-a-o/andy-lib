import {DisplayObject, DisplayObjectListener} from "./DisplayObject";
import {Listeners} from "@andy-lib/util";
import {Sprites} from "../util/Sprites";
import {Rect} from "../util/Rect";
import {Profiler} from "@andy-lib/profiler";
import {EventDispatcher, MouseEventListener} from "./EventDispatcher";
import {KeyHandler, KeyRegistry} from "./KeyRegistry";
import {Tooltip} from "./ui/Tooltip";

export interface StageListener {
    onSpriteAdded?(stage: Stage, sprite: DisplayObject);

    onSpriteRemoved?(stage: Stage, sprite: DisplayObject);

    onStageStarted?(stage: Stage);

    onStageStopped?(stage: Stage);
}

const DEFAULT_CANVAS_ID: string = "default";

export class Stage implements DisplayObjectListener {
    private readonly stageListeners = new Listeners<StageListener>([
        "onSpriteAdded",
        "onSpriteRemoved",
        "onStageStarted",
        "onStageStopped"
    ]);

    private readonly keyRegistry = new KeyRegistry();
    private readonly eventDispatcher: EventDispatcher;
    private readonly renderContextMap: { [key: string]: RenderContext } = {};

    private readonly w: number;
    private readonly h: number;

    private rendering: boolean = false;
    private tooltip: Tooltip;

    private animationFrameId: number | undefined;

    constructor(canvas: HTMLCanvasElement) {
        this.renderContextMap = {};
        this.w = canvas.width;
        this.h = canvas.height;
        this.eventDispatcher = new EventDispatcher(canvas);
        this.addCanvas(canvas);
    }

    addCanvas(canvas: HTMLCanvasElement, key: string = DEFAULT_CANVAS_ID) {
        console.assert(!this.renderContextMap[key]);
        this.renderContextMap[key] = new RenderContext(canvas);
    }

    createCanvas(id: string, clear?: boolean): HTMLCanvasElement {
        const c = this.getCanvas();
        const canvas = Sprites.createCanvas(c.width, c.height);
        canvas.id = id;
        canvas.style.position = "absolute";
        $(canvas).insertBefore(c);
        this.addCanvas(canvas, id);
        this.setClear(clear, id);
        return canvas;
    }

    getCanvas(key: string = DEFAULT_CANVAS_ID): HTMLCanvasElement {
        return this.renderContextMap[key].getCanvas();
    }

    setClear(clear: boolean, key: string = DEFAULT_CANVAS_ID) {
        this.renderContextMap[key].setClear(clear);
    }

    add(s: DisplayObject) {
        const renderContext = this.renderContextMap[s.getCanvasId() || DEFAULT_CANVAS_ID];
        if (renderContext.addSprite(s)) {
            this.registerSprite(s);
            s.onAdded(this);
            this.fireSpriteAdded(s);
        }
    }

    remove(s: DisplayObject) {
        const renderContext = this.renderContextMap[s.getCanvasId() || DEFAULT_CANVAS_ID];
        if (renderContext.removeSprite(s)) {
            this.unregisterSprite(s);
            s.onRemoved(this);
            this.fireSpriteRemoved(s);
        }
    }

    contains(s: DisplayObject, key: string = DEFAULT_CANVAS_ID): boolean {
        return this.renderContextMap[key].containsSprite(s);
    }

    getTopLevelSprites(key?: string): DisplayObject[] {
        let topLevelSprites = [];
        const renderContextMap = this.renderContextMap;
        if (key) {
            const renderContext = renderContextMap[key];
            if (renderContext) {
                topLevelSprites = topLevelSprites.concat(renderContext.getSprites());
            }
        } else {
            for (let mapKey in renderContextMap) {
                if (renderContextMap.hasOwnProperty(mapKey)) {
                    topLevelSprites = topLevelSprites.concat(this.getTopLevelSprites(mapKey));
                }
            }
        }
        return topLevelSprites;
    }

    createSnapshot(key: string = DEFAULT_CANVAS_ID): HTMLCanvasElement {
        const renderContext = this.renderContextMap[key];
        console.assert(!!renderContext, "No render context for key " + key);
        const duplicateContext = renderContext.duplicate();
        duplicateContext.start();
        duplicateContext.invalidate(new Rect(0, 0, this.w, this.h));
        duplicateContext.draw();
        duplicateContext.stop();
        return duplicateContext.getCanvas();
    }

    addStageListener(l: StageListener) {
        this.stageListeners.add(l);
    }

    removeStageListener(l: StageListener) {
        this.stageListeners.remove(l);
    }

    getKeyRegistry(): KeyRegistry {
        return this.keyRegistry;
    }

    addKeyHandler(keys: string[], handler: KeyHandler) {
        this.keyRegistry.addKeyBinding(keys, handler);
    }

    removeKeyHandler(keys: string[], handler: KeyHandler) {
        this.keyRegistry.removeKeyBinding(keys, handler);
    }

    addMouseHandler(handler: MouseEventListener) {
        this.eventDispatcher.addEventListener(handler);
    }

    removeMouseHandler(handler: MouseEventListener) {
        this.eventDispatcher.removeEventListener(handler);
    }

    setDefaultCursor(cursor: string) {
        this.eventDispatcher.setDefaultCursor(cursor);
    }

    getDefaultCursor(): string {
        return this.eventDispatcher.getDefaultCursor();
    }

    setTooltip(tooltip: Tooltip) {
        if (this.tooltip) {
            this.remove(this.tooltip);
            delete this.tooltip;
        }
        this.tooltip = tooltip;
        this.eventDispatcher.setTooltip(tooltip);
        this.add(tooltip);
    }

    getTooltip(): Tooltip {
        return this.eventDispatcher.getTooltip();
    }

    invalidate(rect?: Rect) {
        const map = this.renderContextMap;
        if (!rect) {
            rect = new Rect(0, 0, this.w, this.h);
        }
        for (let key in map) {
            map[key].invalidate(rect);
        }
    }

    draw() {
        const map = this.renderContextMap;
        for (let key in map) {
            Profiler.begin(key);
            map[key].draw();
            Profiler.end(key);
        }
    }

    start() {
        const stage = this;

        const map = this.renderContextMap;
        for (let key in map) {
            if (map.hasOwnProperty(key)) {
                map[key].start();
            }
        }

        function animate() {
            if (stage.rendering) {
                stage.animationFrameId = requestAnimationFrame(animate);
                Profiler.startFrame();
                stage.draw();
                Profiler.endFrame();
            }
        }

        this.eventDispatcher.attach();
        this.rendering = true;

        this.keyRegistry.bindKeys();
        this.invalidate();
        this.fireStarted();
        animate();
    };

    isStarted(): boolean {
        return this.rendering;
    }

    stop() {
        this.rendering = false;
        cancelAnimationFrame(this.animationFrameId);
        this.eventDispatcher.detach();
        this.keyRegistry.unbindKeys();
        const map = this.renderContextMap;
        for (let key in map) {
            if (map.hasOwnProperty(key)) {
                map[key].stop();
            }
        }
        this.fireStopped();
    }

    onChildAdded(p: DisplayObject, c: DisplayObject) {
        this.registerSprite(c);
    }

    onChildRemoved(p: DisplayObject, c: DisplayObject) {
        this.unregisterSprite(c);
    }

    onObjectVisibilityChanged(s: DisplayObject) {
        this.updateSprite(s);
    }

    onObjectAbilityChanged(s: DisplayObject) {
        this.updateSprite(s);
    }

    onObjectDraggableChanged(s: DisplayObject) {
        this.updateCoords(s);
    }

    updateCoords(s: DisplayObject) {
        this.eventDispatcher.removeSprite(s);
        this.eventDispatcher.addSprite(s);
    }

    toJSON(): any {
        const result = {};
        const map = this.renderContextMap;
        for (let canvasId in map) {
            if (map.hasOwnProperty(canvasId)) {
                const sprites = map[canvasId].getSprites();
                const arr = result[canvasId] = new Array(sprites.length);
                for (let i = 0, n = sprites.length; i < n; ++i) {
                    arr[i] = sprites[i].toJSON();
                }
            }
        }
        return result;
    }

    private fireSpriteAdded(sprite: DisplayObject) {
        this.stageListeners.call("onSpriteAdded", [this, sprite]);
    }

    private fireSpriteRemoved(sprite: DisplayObject) {
        this.stageListeners.call("onSpriteRemoved", [this, sprite]);
    }

    private fireStarted() {
        this.stageListeners.call("onStageStarted", [this]);
    }

    private fireStopped() {
        this.stageListeners.call("onStageStopped", [this]);
    }

    private registerSprite(s: DisplayObject) {
        s.addObjectListener(this);
        this.updateSprite(s);
        const children = s.getChildren();
        if (!children) {
            return;
        }
        for (let i = 0, n = children.length; i < n; ++i) {
            const child = children[i];
            this.registerSprite(child);
        }
    }

    private unregisterSprite(s: DisplayObject) {
        s.removeObjectListener(this);
        this.renderContextMap[s.getCanvasId() || DEFAULT_CANVAS_ID].invalidate(s);
        this.eventDispatcher.removeSprite(s);
        const children = s.getChildren();
        if (!children) {
            return;
        }
        for (let i = 0, n = children.length; i < n; ++i) {
            this.unregisterSprite(children[i]);
        }
    }

    private updateSprite(s: DisplayObject) {
        this.renderContextMap[s.getCanvasId() || DEFAULT_CANVAS_ID].updateSprite(s);
        if (s.isEnabled() && s.isVisible()) {
            this.eventDispatcher.addSprite(s);
        } else {
            this.eventDispatcher.removeSprite(s);
        }
    }
}

class RenderContext {
    private readonly rect: Rect = new Rect(0, 0, 0, 0);
    private clear: boolean = false;
    private sprites: DisplayObject[] = [];
    private ctx: CanvasRenderingContext2D;

    constructor(private canvas: HTMLCanvasElement) {
    }

    duplicate() {
        const canvas = Sprites.createCanvas(this.canvas.width, this.canvas.height);
        const renderContext = new RenderContext(canvas);
        renderContext.sprites = this.sprites.slice();
        return renderContext;
    }

    start() {
        this.ctx = this.canvas.getContext("2d");
    }

    stop() {
        delete this.ctx;
    }

    addSprite(s: DisplayObject): boolean {
        this.sprites = this.sprites.slice(); // Copy on write
        const sprites = this.sprites;
        const i = sprites.indexOf(s);
        if (i >= 0) {
            return false;
        }
        Sprites.insertSpriteIntoZIndexOrderedArray(sprites, s);
        return true;
    }

    removeSprite(s: DisplayObject): boolean {
        this.sprites = this.sprites.slice(); // Copy on write
        const sprites = this.sprites;
        const i = sprites.indexOf(s);
        if (i < 0) {
            return false;
        }
        sprites.splice(i, 1);
        return true;
    }

    containsSprite(s: DisplayObject) {
        return (this.sprites.indexOf(s) >= 0);
    }

    invalidate(rect: Rect) {
        this.rect.includeRect(rect);
    }

    updateSprite(s: DisplayObject) {
        s.update(this.rect);
        this.invalidate(s);
    }

    draw() {
        const ctx = this.ctx;
        const rect = this.rect;
        let sprites = this.sprites;
        let i, n = sprites.length;
        for (i = 0; i < n; ++i) {
            Profiler.begin("updateParent");
            sprites[i].update(rect);
            Profiler.end("updateParent");
        }
        // update end
        if (!rect.isEmpty()) {
            if (this.clear) {
                Profiler.begin("clear");
                ctx.clearRect(rect.x, rect.y, rect.w, rect.h);
                Profiler.end("clear");
            }
            sprites = this.sprites;
            n = sprites.length;
            // draw start
            for (i = 0; i < n; ++i) {
                Profiler.begin("drawParent");
                sprites[i].draw(ctx, rect);
                Profiler.end("drawParent");
            }
            // draw end
        }
        rect.reset(0, 0, 0, 0);
    }

    getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    getSprites(): DisplayObject[] {
        return this.sprites;
    }

    setClear(clear: boolean) {
        this.clear = clear;
    }
}