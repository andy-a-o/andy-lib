import {ChannelSelector} from "./ChannelSelector";
import {Random} from "@andy-lib/util";

export class RandomChannelSelector<T> implements ChannelSelector<T> {
    private readonly channels: T[];

    constructor(channels: T[]) {
        this.channels = channels.slice();
    }

    popChannel(): T | undefined {
        const channels = this.channels;
        if (!channels.length) {
            return undefined;
        }
        const i = Random.get(0, this.channels.length - 1);
        const channel = this.channels[i];
        this.channels.splice(i, 1);
        return channel;
    }

    pushBack(channel: T) {
        const i = this.channels.indexOf(channel);
        if (i < 0) {
            this.channels.push(channel);
        }
    }
}
