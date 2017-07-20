import {Listeners} from "@andy-lib/util";
import {Request, RequestType} from "./Request";
import {RequestTimer, RequestTimerConfig} from "./RequestTimer";
import {RequestErrorListener} from "./RequestErrorListener";

export interface RequestFactoryListener {
    onRequestCreated(request: Request);
}

export interface RequestFactoryConfig {
    serialize?: {[uri: string]: boolean | string} | undefined,
    maxAttempts?: number | undefined,
    error?: {status: number[]} | undefined;
    timer?: RequestTimerConfig | undefined;
}

export class RequestFactory {

    protected constructor() {
    }

    static addRequestFactoryListener(l: RequestFactoryListener) {
        RequestFactory.requestFactoryListeners.add(l);
    }

    static removeRequestFactoryListener(l: RequestFactoryListener) {
        RequestFactory.requestFactoryListeners.remove(l);
    }

    static init(config: RequestFactoryConfig) {
        const serialize = config.serialize || {};
        for (let uri in serialize) {
            if (serialize.hasOwnProperty(uri)) {
                let option = serialize[uri];
                if (!option) {
                    RequestFactory.notSerializedUris.push(uri);
                } else if (typeof option == "string") {
                    RequestFactory.requestGroups[uri] = <string>option;
                }
            }
        }
        RequestFactory.maxRequestAttempts = config.maxAttempts || 1;
        this.addRequestFactoryListener(new RequestErrorListener(config.error || {status: [0]}));
        if (config.timer) {
            this.addRequestFactoryListener(new RequestTimer(config.timer));
        }
    }

    static addHeader(name: string, value: string) {
        RequestFactory.headers[name] = value;
    }

    static getHeader(name: string): string | undefined {
        return RequestFactory.headers[name];
    }

    static newRequest(type: RequestType, url: string): Request {
        let request = new Request(type, url);
        for (let name in RequestFactory.headers) {
            if (RequestFactory.headers.hasOwnProperty(name)) {
                request.addHeader(name, RequestFactory.headers[name]);
            }
        }
        request.setGroup(RequestFactory.getGroup(url));
        request.setSerializable(RequestFactory.isSerializable(url));
        request.setMaxAttempts(RequestFactory.maxRequestAttempts);
        RequestFactory.fireRequestCreated(request);
        return request;
    }

    private static fireRequestCreated(request: Request) {
        RequestFactory.requestFactoryListeners.call("onRequestCreated", [request]);
    }

    private static isSerializable(url: string): boolean {
        let serializable = RequestFactory.serializedUrlCache[url];
        if (serializable === undefined) {
            serializable = true;
            for (let i = 0, n = RequestFactory.notSerializedUris.length; i < n; ++i) {
                if (url.indexOf(RequestFactory.notSerializedUris[i]) >= 0) {
                    serializable = false;
                    break;
                }
            }
            RequestFactory.serializedUrlCache[url] = serializable;
        }
        return serializable;
    }

    private static getGroup(url: string): string {
        let group = RequestFactory.groupCache[url];
        if (!group) {
            for (let uri in RequestFactory.requestGroups) {
                if (RequestFactory.requestGroups.hasOwnProperty(uri) && (url.indexOf(uri) >= 0)) {
                    group = RequestFactory.requestGroups[uri];
                    break;
                }
            }
            if (!group) {
                group = Request.DEFAULT_GROUP;
            }
            RequestFactory.groupCache[url] = group;
        }
        return group;
    }

    private static headers: {[name: string]: string} = {};
    private static notSerializedUris: string[] = [];
    private static requestGroups: {[key: string]: string} = {};
    private static serializedUrlCache: {[key: string]: boolean} = {};
    private static groupCache: {[key: string]: string} = {};
    private static maxRequestAttempts: number = 1;

    private static readonly requestFactoryListeners = new Listeners<RequestFactoryListener>([
        "onRequestCreated"
    ]);
}