import {Listeners} from "@andy-lib/util";

export interface BlobRequestListener {
    onBlobLoadStarted?(request: BlobRequest);

    onBlobLoadProgress?(request: BlobRequest, progress: number);

    onBlobLoaded?(request: BlobRequest, blob: any);

    onBlobLoadError?(request: BlobRequest, error: any);
}

const fileAPISupported: boolean = !!(window.URL && window.URL.createObjectURL);

export class BlobRequest {
    private readonly requestListeners = new Listeners<BlobRequestListener>([
        "onBlobLoadStarted",
        "onBlobLoadProgress",
        "onBlobLoaded",
        "onBlobLoadError"
    ]);

    private bytesLoaded: number = 0;
    private readonly request: XMLHttpRequest = new XMLHttpRequest();

    constructor(private url: string,
                private method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
                private responseType: XMLHttpRequestResponseType = "blob") {
    }

    getRequest(): XMLHttpRequest {
        return this.request;
    }

    getResponse(): any {
        return this.request.response;
    }

    addRequestListener(l: BlobRequestListener) {
        this.requestListeners.add(l);
    }

    removeRequestListener(l: BlobRequestListener) {
        this.requestListeners.remove(l);
    }

    getBytesLoaded(): number {
        return this.bytesLoaded;
    }

    cancel() {
        this.request && this.request.abort();
    }

    load(content?: string) {
        const request = this.request;
        request.onreadystatechange = () => {
            if (request.readyState == 1) {
                this.fireLoadStarted();
            }
        };
        request.onprogress = (e) => {
            this.bytesLoaded = e.loaded;
            this.fireLoadProgress(Math.floor(e.loaded / e.total * 100));
        };
        request.onerror = (e) => {
            this.fireLoadError(e);
        };
        request.onload = () => {
            if (request.status < 400) {
                this.fireLoaded(request.response);
            } else {
                this.fireLoadError(request.status);
            }
        };
        request.open("GET", this.url, true);
        request.responseType = this.responseType;
        request.send(content);
    }

    private fireLoadStarted() {
        this.requestListeners.call("onBlobLoadStarted", [this]);
    }

    private fireLoadProgress(progress) {
        this.requestListeners.call("onBlobLoadProgress", [this, progress]);
    }

    private fireLoaded(blob: any) {
        this.requestListeners.call("onBlobLoaded", [this, blob]);
    }

    private fireLoadError(error: any) {
        this.requestListeners.call("onBlobLoadError", [this, error]);
    }

    static isSupported(url?: string): boolean {
        return fileAPISupported && (url || "").indexOf("blob:") != 0;
    }
}