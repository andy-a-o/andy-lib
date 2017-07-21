export interface ChannelSelector<T> {

    popChannel(): T | undefined;

    pushBack(channel: T);
}