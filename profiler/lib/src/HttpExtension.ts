import {ProfilerExtension} from "./ProfilerExtension";
import {Request, RequestListener} from "@andy-lib/server";
import {RequestFactory, RequestFactoryListener} from "@andy-lib/server";
import {ProfilerContext} from "./ProfilerContext";

export interface HttpExtensionOptions {
    count?: number | undefined;
}

const DEFAULT_REQUEST_COUNT = 30;

interface AugmentedRequest extends Request {
    profilerIndex?: number | undefined;
    frameIndex?: number | undefined;
}

export class HttpExtension extends ProfilerExtension implements RequestFactoryListener, RequestListener {
    private readonly dataSerializationArray = new Array(4); // requests, eventRequestIds, eventNames, eventFrames

    private context: ProfilerContext;

    private readonly requests: string[];
    private readonly requestIds: number[];
    private requestIndex: number = 0;

    private readonly eventRequestIds: number[];
    private readonly eventNames: string[];
    private readonly eventFrames: number[];
    private eventIndex: number = 0;
    private frameIndex: number = 0;

    constructor(options: HttpExtensionOptions) {
        super("http");

        const count = options.count || DEFAULT_REQUEST_COUNT;
        this.requests = new Array<string>(count);
        this.requestIds = new Array<number>(count);

        const eventCount = count * 3; // queued, sent, completed | error
        this.eventRequestIds = new Array<number>(eventCount);
        this.eventNames = new Array<string>(eventCount);
        this.eventFrames = new Array<number>(eventCount);

        RequestFactory.addRequestFactoryListener(this);
    }

    init(context: ProfilerContext) {
        this.context = context;
    }

    onRequestCreated(request: Request) {
        if (request.getUrl().indexOf(this.context.getFlushUrl()) < 0) {
            request.addRequestListener(this);
            this.requestEvent(<AugmentedRequest>request, "created", true);
        }
    }

    onRequestQueued(request: Request) {
        this.requestEvent(request, "queued");
    }

    onRequestSent(request: Request) {
        this.requestEvent(request, "sent");
    }

    onRequestCompleted(request: Request) {
        this.requestEvent(request, "completed");
    }

    onRequestError(request: Request, xhr: XMLHttpRequest, textStatus: string, errorThrown: any) {
        let event = "error" + xhr.status;
        if (errorThrown) {
            event += " (" + errorThrown + ")";
        }
        if (textStatus) {
            event += " [" + textStatus + "]";
        }
        this.requestEvent(request, event);
    }

    reset(context: ProfilerContext) {
        this.requestIndex = 0;
        this.eventIndex = 0;
        ++this.frameIndex;
    }

    private requestEvent(request: AugmentedRequest, eventName: string, dontSave?: boolean) {
        const id = request.getId();
        const requests = this.requests;
        const requestIds = this.requestIds;
        let index = request.profilerIndex;
        if (request.frameIndex !== this.frameIndex) {
            request.frameIndex = this.frameIndex;
            index = request.profilerIndex = this.requestIndex++;
            delete requests[index];
            requestIds[index] = id;
        }
        if ((index !== undefined) && !requests[index] && !dontSave) {
            requests[index] = JSON.stringify(request);
        }
        const eventIndex = this.eventIndex++;
        this.eventRequestIds[eventIndex] = id;
        this.eventNames[eventIndex] = eventName;
        this.eventFrames[eventIndex] = this.context.getCurrentFrame();
    }

    serialize(context: ProfilerContext): string | null {
        const eventIndex = this.eventIndex;
        if (eventIndex == 0) {
            return null;
        }
        const requestIndex = this.requestIndex;
        const arr = this.dataSerializationArray;
        arr[0] = this.requests.slice(0, requestIndex).join("\t"); // other symbols may present in JSON
        arr[1] = this.eventRequestIds.slice(0, eventIndex).join(",");
        arr[2] = this.eventNames.slice(0, eventIndex).join(",");
        arr[3] = this.eventFrames.slice(0, eventIndex).join(",");
        return arr.join("\v"); // other symbols may present in JSON
    }
}