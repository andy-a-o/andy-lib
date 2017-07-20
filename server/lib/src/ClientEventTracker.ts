import {RequestFactoryListener} from "./RequestFactory";
import {Request, RequestListener} from "./Request";

export interface ClientEventTrackerConfig {
    events: {[name: string]: number | boolean},
    max: number,
    excludeUris: string[];
}

/**
 * Tracks various user events and sends tracking info to server
 * via additional request headers X-USER-EVENT.
 */
export class ClientEventTracker implements RequestFactoryListener, RequestListener {
    private readonly subscribedEvents: {[name: string]: number | boolean};
    private readonly events: any[];
    private currentEventIndex: number = 0;
    private unsentEventCount: number = 0;
    private readonly requestEventCountMap: {[key: number]: number} = {};
    private readonly excludedUris: string[];

    constructor(config: ClientEventTrackerConfig) {
        this.subscribedEvents = config.events || {};
        this.events = new Array(config.max || 100);
        for (let i = 0, n = this.events.length; i < n; ++i) {
            this.events[i] = {name: undefined, data: undefined};
        }
        this.excludedUris = config.excludeUris || [];
        ClientEventTracker.tracker = this;
    }

    onRequestCreated(request: Request) {
        const url = request.getUrl();
        const excludedUris = this.excludedUris;
        for (let i = 0, n = excludedUris.length; i < n; ++i) {
            if (url.indexOf(excludedUris[i]) >= 0) {
//                console.debug("Skipping url", url);
                return;
            }
        }
        request.addRequestListener(this);
    }

    onRequestBeforeSend(request: Request) {
        const unsentEventCount = this.unsentEventCount;
        if (!unsentEventCount) {
//            console.debug("No unsent events");
            return;
        }
        this.requestEventCountMap[request.getId()] = unsentEventCount;
        const events = this.events;
        const startIndex = this.currentEventIndex - unsentEventCount;
        const eventNames = new Array(unsentEventCount);
        for (let i = 0; i < unsentEventCount; ++i) {
            const event = events[(startIndex + i) % events.length];
            eventNames[i] = event.name;
            if (event.data !== undefined) {
                request.addHeader(`X-EVENT${i}-DATA`, JSON.stringify(event.data));
            }
        }
        const eventNamesHeader = eventNames.join(",");
//        console.debug("Sending events", eventNamesHeader);
        request.addHeader("X-CLIENT-EVENT", eventNamesHeader);
        this.unsentEventCount = 0;
    }

    onRequestCompleted(request: Request, response: any, xmlHttpRequest: XMLHttpRequest) {
        this.handleResponse(request, xmlHttpRequest);
    }

    onRequestFailed(request: Request, xmlHttpRequest: XMLHttpRequest) {
        this.handleResponse(request, xmlHttpRequest);
    }

    private handleResponse(request: Request, xmlHttpRequest: XMLHttpRequest) {
        const id = request.getId();
        const requestEventCountMap = this.requestEventCountMap;
        const status = xmlHttpRequest.getResponseHeader("X-EVENT-STATUS");
        if (status !== "OK") {
            const unsentEventCount = requestEventCountMap[id];
            if (unsentEventCount) {
//                console.debug("Request #" + id + " failed");
//                console.debug("Will re-send " + unsentEventCount + " events later");
                this.unsentEventCount += unsentEventCount; // Re-send events with next request
            }
        }
        const cancelEvents = xmlHttpRequest.getResponseHeader("X-CANCEL-EVENTS");
        if (cancelEvents) {
            this.cancelEvents(cancelEvents.split(","));
        }
        const subscribeEvents = xmlHttpRequest.getResponseHeader("X-SUBSCRIBE-EVENTS");
        if (subscribeEvents) {
            this.subscribeEvents(subscribeEvents.split(","));
        }
        delete requestEventCountMap[id];
    }

    handleEvent(name: string, data?: any) {
        const subscribedEvents = this.subscribedEvents;
        if (!subscribedEvents[name]) {
            return;
        } else if (subscribedEvents[name] !== true) {
            subscribedEvents[name] = <number>subscribedEvents[name] - 1;
        }
//        console.debug(name, data);
        const events = this.events;
        const event = events[this.currentEventIndex % events.length];
        event.name = name;
        event.data = data;
        ++this.currentEventIndex;
        ++this.unsentEventCount;
    }

    private cancelEvents(eventNames: string[]) {
        for (let i = 0, n = eventNames.length; i < n; ++i) {
            const eventName = eventNames[i];
            delete this.subscribedEvents[eventName];
//            console.debug("Event " + eventName + " cancelled");
        }
    }

    private subscribeEvents(eventNames: string[]) {
        for (let i = 0, n = eventNames.length; i < n; ++i) {
            const eventName = eventNames[i];
            if (!this.subscribedEvents[eventName]) {
                this.subscribedEvents[eventName] = true;
//                console.debug("Event " + eventName + " subscribed");
            }
        }
    }

    static event(name: string, data?: any) {
        ClientEventTracker.tracker &&
        ClientEventTracker.tracker.handleEvent(name, data);
    }

    private static tracker: ClientEventTracker;
}