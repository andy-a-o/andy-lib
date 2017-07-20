import {ProfilerExtension} from "./ProfilerExtension";

export class TimeExtension extends ProfilerExtension {
    private readonly time: number[] = new Array<number>(2);

    constructor() {
        super("time");
    }

    init() {
        this.time[0] = Date.now();
    }

    reset() {
        this.time[0] = this.time[1];
    }

    serialize(): string {
        this.time[1] = Date.now();
        return this.time.join("|");
    }
}