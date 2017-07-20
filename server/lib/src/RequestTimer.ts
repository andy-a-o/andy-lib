import {RequestFactoryListener} from "./RequestFactory";
import {Request, RequestListener} from "./Request";

export interface RequestTimerConfig {
    timeout: number | undefined;
    progressive: boolean | undefined;
}

export class RequestTimer implements RequestFactoryListener, RequestListener {
    private timeout: number | undefined;
    private progressive: boolean;

    constructor(config: RequestTimerConfig) {
        this.timeout = config.timeout;
        this.progressive = config.progressive || false;
    }

    onRequestCreated(request: Request) {
        request.addRequestListener(this);
    }

    onRequestBeforeSend(request: Request) {
        const url = request.getUrl();
        request.setUrl(url + ((url.indexOf("?") > 0) ? "&" : "?") + "time=" + Date.now());
        if (this.timeout) {
            request.setTimeout(this.timeout);
        }
    }

    onRequestError(request: Request, response: XMLHttpRequest, textStatus: string, errorThrown: any) {
        if (textStatus !== "timeout") {
            return;
        }
        if (this.progressive && this.timeout) {
            request.setTimeout(this.timeout * (request.getAttempt() + 1));
        }
        request.retry();
    }
}