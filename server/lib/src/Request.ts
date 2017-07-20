import {Listeners} from "@andy-lib/util";

export type RequestType = "GET" | "POST" | "PUT" | "DELETE";

export interface RequestListener {
    onRequestQueued?(request: Request);
    onRequestBeforeSend?(request: Request);
    onRequestSent?(request: Request);
    onRequestCompleted?(request: Request, response: any, xmlHttpRequest: XMLHttpRequest);
    onRequestFailed?(request: Request, response: XMLHttpRequest, textStatus: string, errorThrown: string);
    onRequestError?(request: Request, response: XMLHttpRequest, textStatus: string, errorThrown: string);
}

export class Request {
    static DEFAULT_GROUP = "default";
    private static NEXT_ID = 1;

    private id: number;
    private time: number;
    private headers: {[name: string]: any} = {};
    private contentType: string | boolean;
    private group: string | undefined;
    private requestTimeout: number | undefined;
    private maxAttempts: number | undefined;
    private serializable: boolean | undefined;
    private dataType: string | undefined;
    private cache: boolean | undefined;
    private processData: boolean | undefined;
    private data: any | undefined;
    private attempt: number = 0;
    private done: boolean | undefined;

    private readonly requestListeners: Listeners<RequestListener> =
        new Listeners<RequestListener>([
            "onRequestQueued",
            "onRequestBeforeSend",
            "onRequestSent",
            "onRequestCompleted",
            "onRequestError",
            "onRequestFailed"
        ]);

    constructor(private type: RequestType, private url: string) {
        this.id = Request.NEXT_ID++;
        this.time = Date.now();
        this.headers = {};
        this.contentType = "application/x-www-form-urlencoded";
    }

    getId(): number {
        return this.id;
    }

    getTime(): number {
        return this.time;
    }

    getType(): RequestType {
        return this.type;
    }

    setType(type: RequestType): Request {
        this.type = type;
        return this;
    }

    /**
     * @param timeout Milliseconds
     */
    setTimeout(timeout: number): Request {
        this.requestTimeout = timeout;
        return this;
    }

    getTimeout(): number | undefined {
        return this.requestTimeout;
    }

    setMaxAttempts(maxAttempts: number) {
        this.maxAttempts = maxAttempts;
        return this;
    }

    getMaxAttempts(): number | undefined {
        return this.maxAttempts;
    }

    getUrl(): string {
        return this.url;
    }

    setUrl(url: string): Request {
        this.url = url;
        return this;
    }

    addHeader(name: string, value: any): Request {
        this.headers[name] = value;
        return this;
    }

    getHeader(name: string): any {
        return this.headers[name];
    }

    getHeaders(): {[key: string]: string} {
        return this.headers;
    }

    setSerializable(serializable: boolean) {
        this.serializable = serializable;
    }

    isSerializable(): boolean | undefined {
        return this.serializable;
    }

    setGroup(group: string) {
        this.group = group;
    }

    getGroup(): string | undefined {
        return this.group;
    }

    addRequestListener(l: RequestListener): Request {
        this.requestListeners.add(l);
        return this;
    }

    removeRequestListener(l: RequestListener): Request {
        this.requestListeners.remove(l);
        return this;
    }

    setContentType(contentType: string | boolean): Request {
        this.contentType = contentType;
        return this;
    }

    getContentType(): string | boolean {
        return this.contentType;
    }

    setDataType(dataType: string | undefined): Request {
        this.dataType = dataType;
        return this;
    }

    getDataType(): string | undefined {
        return this.dataType;
    }

    setCache(cache: boolean): Request {
        this.cache = cache;
        return this;
    }

    isCache(): boolean | undefined {
        return this.cache;
    }

    setProcessData(processData: boolean): Request {
        this.processData = processData;
        return this;
    }

    isProcessData(): boolean | undefined {
        return this.processData;
    }

    setData(data: any): Request {
        this.data = data;
        return this;
    }

    getData(): any {
        return this.data;
    }

    send() {
        // Modifying requests must be serialized, see #126
        this.attempt = 0;
        if (this.serializable) {
            Request.queue(this);
        } else {
            Request.submit(this);
        }
    }

    getAttempt(): number {
        return this.attempt;
    }

    protected beforeSend() {
        this.fireBeforeSend();
    }

    protected sent() {
        this.fireSent();
    }

    protected queued() {
        this.fireQueued();
    }

    protected completed(response: any, xmlHttpRequest: XMLHttpRequest) {
        this.done = true;
        this.fireCompleted(response, xmlHttpRequest);
    }

    protected error(response: XMLHttpRequest, textStatus: string, errorThrown: string) {
        console.warn(`Request ${this.type} ${this.url} ${textStatus}`);
        this.done = true;
        this.fireError(response, textStatus, errorThrown);
    }

    protected failed(response: XMLHttpRequest, textStatus: string, errorThrown: string) {
        this.done = true;
        console.error(`Request ${this.type} ${this.url} failed`);
        this.fireFailed(response, textStatus, errorThrown);
    }

    public retry() {
        if (this.attempt < this.maxAttempts) {
            console.debug(`Retry request ${this.type} ${this.url}`);
            this.done = false;
            Request.submit(this);
        }
    }

    isDone(): boolean {
        return !!this.done;
    }

    private fireQueued() {
        this.requestListeners.call("onRequestQueued", [this]);
    }

    private fireBeforeSend() {
        this.requestListeners.call("onRequestBeforeSend", [this]);
    }

    private fireSent() {
        this.requestListeners.call("onRequestSent", [this]);
    }

    private fireCompleted(response: any, xmlHttpRequest: XMLHttpRequest) {
        this.requestListeners.call("onRequestCompleted", [this, response, xmlHttpRequest]);
    }

    private fireError(response: any, textStatus: string, errorThrown: string) {
        this.requestListeners.call("onRequestError", [this, response, textStatus, errorThrown]);
    }

    private fireFailed(response: XMLHttpRequest, textStatus: string, errorThrown: string) {
        this.requestListeners.call("onRequestFailed", [this, response, textStatus, errorThrown]);
    }

    toString() {
        return `${this.type} ${this.url}`;
    }

    toJSON(): any {
        return {
            id: this.id,
            time: this.time,
            type: this.type,
            url: this.url,
            headers: this.headers,
            contentType: this.contentType,
            data: this.data,
            dataType: this.dataType,
            serializable: this.serializable,
            attempt: this.attempt,
            maxAttempts: this.maxAttempts
        };
    }

    private static requestQueueMap = {};
    private static pendingRequests = {};

    private static queue(request: Request) {
        const group = request.group || Request.DEFAULT_GROUP;
        if (!request.attempt) {
            request.queued();
        }
        if (!Request.pendingRequests[group]) {
            Request.pendingRequests[group] = request;
            Request.submit(request);
            return;
        }
        Request.getQueue(group).push(request);
    }

    private static getQueue(group: string) {
        let requestQueue = Request.requestQueueMap[group];
        if (!requestQueue) {
            requestQueue = Request.requestQueueMap[group] = [];
        }
        return requestQueue;
    }

    private static submit(request: Request) {
        const attempt = request.attempt;
        const serializable = request.serializable;
        if (!attempt) {
            request.beforeSend();
        }
        ++request.attempt;
        // TODO: implement without jQuery.ajax
        // $.ajax({
        //     type: request.type,
        //     url: request.url,
        //     headers: request.headers,
        //     dataType: request.dataType,
        //     contentType: request.contentType,
        //     cache: request.cache,
        //     data: (request.contentType == "application/json")
        //         ? JSON.stringify(request.data)
        //         : request.data,
        //     processData: request.processData,
        //     timeout: request.requestTimeout,
        //     success: function (response, textStatus, xmlHttpRequest) {
        //         serializable && Request.complete(request);
        //         request.completed(response, xmlHttpRequest);
        //     },
        //     error: function (response: XMLHttpRequest, textStatus: string, errorThrown: string) {
        //         try {
        //             request.error(response, textStatus, errorThrown);
        //         } catch (e) {
        //             console.error(e);
        //         }
        //         if (request.done) {
        //             serializable && Request.complete(request);
        //             request.failed(response, textStatus, errorThrown);
        //         }
        //     }
        // });
        if (!attempt) {
            request.sent();
        }
    }

    private static complete(request: Request) {
        const group = request.getGroup() || Request.DEFAULT_GROUP;
        delete Request.pendingRequests[group];
        const requestQueue = Request.getQueue(group);
        if (requestQueue.length > 0) {
            request = requestQueue.shift();
            Request.pendingRequests[group] = request;
            Request.submit(request);
        }
    }
}