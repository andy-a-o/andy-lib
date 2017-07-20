import {ProfilerExtension} from "./ProfilerExtension";
import {ProfilerContext} from "./ProfilerContext";

export interface EventExtensionOptions {
    count?: number | undefined;
}

const DEFAULT_EVENT_COUNT = 100;

export class EventExtension extends ProfilerExtension {
    private readonly eventFrames: number[];
    private readonly eventNames: string[];
    private eventIndex: number;

    constructor(options: EventExtensionOptions) {
        super("events");
        this.eventIndex = 0;
        const eventCount = options.count || DEFAULT_EVENT_COUNT;
        this.eventFrames = new Array(eventCount);
        this.eventNames = new Array(eventCount);
    }

    event(text: string, context: ProfilerContext) {
        this.eventFrames[this.eventIndex] = context.getCurrentFrame();
        this.eventNames[this.eventIndex] = text;
        ++this.eventIndex;
    }

    reset(context: ProfilerContext) {
        this.eventIndex = 0;
    }

    serialize(context: ProfilerContext): string | null {
        if (this.eventIndex == 0) {
            return null;
        }
        const events = new Array(2);
        events[0] = this.eventFrames.slice(0, this.eventIndex).join(",");
        events[1] = this.eventNames.slice(0, this.eventIndex).join(",");
        return events.join("|");
    }
}