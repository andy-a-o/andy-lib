import {Rectangle} from "../shape/Rectangle";
import {ShapeConfig} from "../shape/AbstractShape";
import {Timer, TimerListener} from "@andy-lib/util";
import {DisplayObject, DisplayObjectListener} from "../DisplayObject";
import {Text, TextConfig} from "../Text";

export interface TooltipConfig extends ShapeConfig {
    padding?: number[] | undefined;
    offset?: any | undefined;
    delay?: number | undefined;
    text?: TextConfig | undefined;
}

const DEFAULTS: TooltipConfig = {
    x: 0, y: 0, w: 0, h: 0, z: Number.MAX_VALUE,
    padding: [2, 2, 2, 2],
    offset: [7, 7],
    color: "white",
    border: {color: "black", width: 1},
    delay: 1000
};

const TEXT_DEFAULTS: TextConfig = {
    x: 0, y: 0, w: 0, h: 0,
    color: "black",
    align: "left",
    line: {height: 14},
    font: {name: "Arial, sans-serif", size: 12}
};

export class Tooltip extends Rectangle implements DisplayObjectListener, TimerListener {
    private readonly defaultDelay: number;
    private readonly timer: Timer;
    private readonly padding: number[] | undefined;
    private readonly offset: number[] | undefined;
    private readonly text: Text;

    private owner: DisplayObject | undefined | null;
    private adjustedTo: DisplayObject | undefined;

    constructor(res: TooltipConfig = DEFAULTS) {
        super({...DEFAULTS, ...res} as ShapeConfig);
        const padding = res.padding;
        const offset = res.offset;
        this.defaultDelay = res.delay;
        this.padding = padding;
        this.offset = offset as number[];
        this.timer = new Timer(this.defaultDelay);
        this.timer.addTimerListener(this);
        console.assert(this.padding.length == 4, `Invalid padding: ${padding}; must be 4-element array (left, top, right and bottom)`);
        console.assert(this.offset.length == 2, `Invalid offset: ${offset}; must be 2-element array (x and y)`);
        this.text = new Text({...TEXT_DEFAULTS, ...(res && res.text)});
        this.text.setCanMove(true);
        this.addChild(this.text);
        this.setCanMove(true);
    }

    onTimer(timer: Timer) {
        timer.stop();
        if (this.owner.isVisible() && this.owner.isEnabled()) {
            this.add();
            this.adjustedTo = this.owner;
        }
    }

    onObjectUpdated() {
        this.updateTooltip();
    }

    /**
     * @param owner Tooltip owner (can be <code>null</code> which means no owner).
     * @return Whether the tip has been configured for the given owner.
     */
    setOwner(owner: DisplayObject | null): boolean {
        if (this.owner != owner) {
            if (this.owner) {
                this.owner.removeObjectListener(this);
            }
            this.owner = owner;
            delete this.adjustedTo;
            this.timer.stop();
            this.remove();
            if (owner) {
                if (this.updateTooltip()) {
                    if (owner.isTipDynamic()) {
                        owner.addObjectListener(this);
                    }
                    return true;
                }
            }
        }
        return false;
    }

    getOwner(): DisplayObject | undefined | null {
        return this.owner;
    }

    adjustTo(cursorX: number, cursorY: number) {
        if (!this.owner || (this.adjustedTo == this.owner)) {
            return;
        }
        const canvas = this.getStage().getCanvas();
        const offset = this.offset;
        const padding = this.padding;
        const x = Math.min(cursorX + offset[0], canvas.width - this.w);
        const y = Math.min(cursorY + offset[1], canvas.height - this.h);
        if ((this.x == x) && (this.y == y)) {
            return;
        }
        this.move(x, y);
        this.text.move(x + padding[0], y + padding[1]);
        this.timer.stop();
        this.timer.start();
    }

    private updateTooltip(): boolean {
        const owner = this.owner;
        const delay = owner.getTipDelay();
        this.timer.setInterval((delay !== undefined) ? delay : this.defaultDelay);
        const tip = owner.getTip();
        console.assert(!!tip, `Display object ${owner.getId()} has no tooltip configured`);
        if (typeof tip === "string") {
            const params = owner.getTipParams();
            this.text.setTemplate(<string>tip);
            this.text.interpolate(params || {});
            this.text.adjustSizeToText();
            const padding = this.padding;
            this.resize(
                this.text.w + padding[0] + padding[2],
                this.text.h + +padding[1] + padding[3]);
            return true;
        }
        return false;
    }
}