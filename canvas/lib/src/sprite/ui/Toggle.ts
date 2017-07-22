import {Button, ButtonConfig} from "./Button";
import {Listeners} from "@andy-lib/util";
import {DisplayObject} from "../DisplayObject";
import {MouseEventListener} from "../EventDispatcher";

export interface ToggleListener {
    onToggleChanged(toggle: Toggle);
}

export interface ToggleConfig extends ButtonConfig {
    auto?: boolean | undefined;
    toggled?: boolean | undefined;
}

export class Toggle extends Button {
    private readonly toggleListeners = new Listeners<ToggleListener>(["onToggleChanged"]);
    private toggled?: boolean | undefined;

    constructor(res: ToggleConfig) {
        super(res);
        if (res.auto) {
            this.addButtonListener({
                onButtonClicked(button: Toggle) {
                    button.setToggled(!button.isToggled());
                }
            })
        }
        this.setToggled(!!res.toggled);
    }

    addLabel(label: DisplayObject & MouseEventListener) {
        label.onClick = () => {
            this.handleClick();
        };
    }

    addToggleListener(l: ToggleListener) {
        this.toggleListeners.add(l);
    }

    removeToggleListener(l: ToggleListener) {
        this.toggleListeners.remove(l);
    }

    setToggled(toggled: boolean) {
        if (this.toggled != toggled) {
            this.toggled = toggled;
            let frameName = "normal";
            if (toggled) {
                frameName = this.hasFrame("toggled") ? "toggled" : "hover";
            }
            super.updateFrame(frameName);
            this.fireToggleChanged();
        }
    }

    isToggled(): boolean {
        return this.toggled;
    }

    protected updateFrame(frameName: string) {
        if (this.toggled) {
            return;
        }
        super.updateFrame(frameName);
    }

    private fireToggleChanged() {
        this.toggleListeners.call("onToggleChanged", [this]);
    }
}