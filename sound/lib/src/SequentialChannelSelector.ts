import {ChannelSelector} from "./ChannelSelector";

export class SequentialChannelSelector<T> implements ChannelSelector<T> {
    private index: number = 0;

    constructor(private channels: T[]) {
    }

    popChannel(): T | undefined {
        return this.channels[this.index++ % this.channels.length];
    }

    pushBack(channel: T) {
        // Do nothing
    }
}