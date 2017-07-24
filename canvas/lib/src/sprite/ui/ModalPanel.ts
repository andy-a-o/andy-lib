import {Rectangle} from "../shape/Rectangle";
import {ShapeConfig} from "../shape/AbstractShape";
import {DisplayObject} from "../DisplayObject";
import {MouseEventListener} from "../EventDispatcher";
import {Button, ButtonConfig} from "./Button";
import {Stage} from "../Stage";
import $ from 'jquery';

export interface ModalPanelConfig extends ShapeConfig {
}

export class ModalPanel extends Rectangle implements MouseEventListener {
    private readonly originZ: number;
    private closeOnEscape: boolean = false;
    private closeOnClick: boolean = false;

    constructor(res: ModalPanelConfig) {
        super(res);
        this.setDraggable(true);
        this.closeOnEscape = false;
        this.closeOnClick = false;
        this.originZ = this.z;
    }

    addChild(c: DisplayObject) {
        super.addChild(c);
        this.addCloseInterceptor(c);
    }

    addCloseInterceptor(c: DisplayObject & MouseEventListener) {
        if (this.closeOnClick && !c.onClick) {
            c.onClick = () => {
            }
        }
    }

    setCloseOnEscape(close: boolean) {
        this.closeOnEscape = close;
    }

    isCloseOnEscape(): boolean {
        return this.closeOnEscape;
    }

    setCloseOnClick(close: boolean) {
        this.closeOnClick = close;
        if (close) {
            const children = this.getChildren();
            for (let i = 0, n = children.length; i < n; ++i) {
                this.addCloseInterceptor(children[i]);
            }
        }
    }

    isCloseOnClick(): boolean {
        return this.closeOnClick;
    }

    addCloseButton(res: ButtonConfig): Button {
        const panel = this;
        const button = new Button(res);
        button.addButtonListener({
            onButtonClicked() {
                panel.hide();
            }
        });
        this.addChild(button);
        return button;
    }

    onAdded(stage: Stage) {
        super.onAdded(stage);
        if (!this.isVisible()) {
            this.remove();
        }
    }

    setVisible(visible: boolean) {
        super.setVisible(visible);
        if (visible) {
            if (maxZIndex) {
                this.z = ++maxZIndex;
            } else {
                maxZIndex = this.z;
            }
            this.add();
            if (this.closeOnEscape) {
                $(document).on(`keyup.${this.id}`, (e) => {
                    switch (e.keyCode || e.which) {
                        case 27: // Esc
                            this.hide();
                            break;
                    }
                });
            }
        } else {
            this.remove();
            this.z = this.originZ;
            $(document).off(`keyup.${this.id}`);
        }
    }

    onMouseDown() {
        // Handle all mouse down events
    }

    onMouseUp() {
        // Handle all mouse up events
    }

    onMouseOver() {
        // Handle all mouse over events
    }

    onMouseOut() {
        // Handle all mouse out events
    }

    onMouseMove() {
        // Handle all mouse move events
    }

    onClick() {
        if (this.closeOnClick) {
            this.hide();
        }
    }
}

let maxZIndex: number;