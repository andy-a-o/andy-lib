import {Listeners} from "@andy-lib/util";
import {Text, TextConfig} from "../Text";
import {MouseEventListener} from "../EventDispatcher";

export interface LinkListener {
    onLinkClicked(link: Link);
}

export class Link extends Text implements MouseEventListener {
    private readonly linkListeners = new Listeners<LinkListener>([
        "onLinkClicked"
    ]);

    constructor(res: TextConfig) {
        super(res);
        if (!this.underline) {
            this.underline = 1;
        }
    }

    addLinkListener(l: LinkListener) {
        this.linkListeners.add(l);
    }

    removeLinkListener(l: LinkListener) {
        this.linkListeners.remove(l);
    }

    onMouseOver() {
        this.setUnderline(this.underline);
    }

    onMouseOut() {
        this.setUnderline(0);
    }

    onClick() {
        this.fireClicked();
    }

    private fireClicked() {
        this.linkListeners.call("onLinkClicked", [this]);
    }
}