import {SpriteSheet, SpriteSheetConfig} from "../SpriteSheet";
import {Listeners} from "@andy-lib/util";
import {DisplayObject} from "../DisplayObject";
import {Sound, SoundConfig, SoundFactory} from "@andy-lib/sound";
import {AbstractText, AbstractTextConfig} from "../AbstractText";
import {Profiler} from "@andy-lib/profiler";
import {Sprite, SpriteConfig} from "../Sprite";
import {Sprites} from "../../util/Sprites";
import {TextFactory} from "../TextFactory";
import {MouseEventListener} from "../EventDispatcher";

export interface ButtonListener {
    onButtonHover?(button: Button);

    onButtonHoverOut?(button: Button);

    onButtonClicked?(button: Button);
}

export interface FrameConfig {
    normal?: number | undefined;
    hover?: number | undefined;
    pressed?: number | undefined;
    disabled?: number | undefined;
}

export interface ButtonSoundConfig {
    mouseup?: SoundConfig<any> | undefined;
    mousedown?: SoundConfig<any> | undefined;
    click?: SoundConfig<any> | undefined;
}

export interface ButtonConfig extends SpriteSheetConfig {
    frames?: FrameConfig | undefined;
    icon?: SpriteConfig | undefined;
    name?: string | undefined;
    text?: AbstractTextConfig | undefined;
    sound?: ButtonSoundConfig | undefined;
}

/**
 * A sprite sheet with two or three frames: normal state, hover, click.
 */
export class Button extends SpriteSheet implements MouseEventListener {
    private readonly buttonListeners = new Listeners<ButtonListener>([
        "onButtonHover",
        "onButtonHoverOut",
        "onButtonClicked"
    ]);

    private readonly frames: FrameConfig;
    private readonly buttonName: string;
    private readonly icon?: DisplayObject | undefined;
    readonly text?: AbstractText | undefined;
    private readonly mouseUpSound: Sound<any> | undefined;
    private readonly mouseDownSound: Sound<any> | undefined;
    private readonly clickSound: Sound<any> | undefined;

    constructor(res: ButtonConfig) {
        super(res);
        this.frames = res.frames || {normal: 0, hover: 1, pressed: 2, disabled: 3};
        this.buttonName = res.name || getImageBaseName(res.src || this.img.src);
        const icon = res.icon;
        if (icon) {
            this.addChild(this.icon = this.newIcon(icon));
        }
        const text = res.text;
        if (text) {
            this.addChild(this.text = this.newText(text));
        }
        const sound = res.sound;
        if (sound) {
            this.mouseUpSound = sound.mouseup && SoundFactory.create(sound.mouseup);
            this.mouseDownSound = sound.mousedown && SoundFactory.create(sound.mousedown);
            this.clickSound = sound.click && SoundFactory.create(sound.click);
        }
        this.updateFrame("normal");
    }

    addButtonListener(l: ButtonListener) {
        this.buttonListeners.add(l);
    }

    removeButtonListener(l: ButtonListener) {
        this.buttonListeners.remove(l);
    }

    getIcon(): DisplayObject {
        return this.icon;
    }

    getText(): AbstractText {
        return this.text;
    }

    setEnabled(enabled: boolean) {
        super.setEnabled(enabled);
        if (this.hasFrame("disabled")) {
            if (enabled) {
                this.updateFrame("normal");
            } else {
                this.updateFrame("disabled");
            }
        }
    };

    onMouseOver(x: number, y: number) {
        this.updateFrame("hover");
        this.fireHover();
    }

    onMouseOut(x: number, y: number) {
        if (!this.isEnabled() && this.hasFrame("disabled")) {
            this.updateFrame("disabled");
        } else {
            this.updateFrame("normal");
        }
        this.fireHoverOut();
    }

    onMouseDown(x: number, y: number) {
        this.mouseDownSound && this.mouseDownSound.play();
        this.updateFrame("pressed");
    }

    onMouseUp(x: number, y: number) {
        this.mouseUpSound && this.mouseUpSound.play();
        if (!this.isEnabled()) {
            if (this.hasFrame("disabled")) {
                this.updateFrame("disabled");
            } else {
                this.updateFrame("normal");
            }
        } else {
            this.updateFrame("hover");
        }
    }

    onClick(x: number, y: number) {
        this.handleClick();
    }

    protected hasFrame(frameName: string): boolean {
        const frame = this.frames[frameName];
        return (frame !== undefined) && frame < this.getFrameCount();
    }

    protected updateFrame(frameName: string) {
        const frame = this.frames[frameName];
        if (frame === undefined) {
            this.setFrame(-1);
            return;
        }
        this.setFrame(Math.min(this.frameCount - 1, frame));
    }

    protected handleClick() {
        this.clickSound && this.clickSound.play();
        this.fireClicked();
    }

    protected fireHover() {
        this.buttonListeners.call("onButtonHover", [this]);
    }

    protected fireHoverOut() {
        this.buttonListeners.call("onButtonHoverOut", [this]);
    }

    protected fireClicked() {
        Profiler.event(`${this.buttonName}:click`);
        this.buttonListeners.call("onButtonClicked", [this]);
    }

    protected newIcon(res: SpriteConfig): DisplayObject {
        const sprite = new Sprite(Sprites.addOffset(res, this));
        const mouseEventListener = sprite as MouseEventListener;
        mouseEventListener.onClick = this.onClick.bind(this);
        mouseEventListener.onMouseUp = this.onMouseUp.bind(this);
        mouseEventListener.onMouseDown = this.onMouseDown.bind(this);
        mouseEventListener.onMouseOver = this.onMouseOver.bind(this);
        mouseEventListener.onMouseOut = this.onMouseOut.bind(this);
        return sprite;
    }

    protected newText(res: AbstractTextConfig): AbstractText {
        return TextFactory.create(Sprites.addOffset(res, this));
    }

    toJSON(): any {
        return {
            ...super.toJSON(),
            buttonName: this.buttonName
        };
    }
}

function getImageBaseName(imageUrl: string): string {
    let name = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
    let i = name.indexOf("?");
    if (i >= 0) {
        name = name.substring(0, i);
    }
    i = name.lastIndexOf(".");
    if (i >= 0) {
        name = name.substring(0, i);
    }
    return name;
}