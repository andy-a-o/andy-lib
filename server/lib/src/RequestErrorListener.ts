import {RequestFactoryListener} from "./RequestFactory";
import {Request, RequestListener} from "./Request";

export class RequestErrorListener implements RequestFactoryListener, RequestListener {
    private status: number[];

    constructor(config?: {status: number[] | undefined}) {
        this.status = (config && config.status) || [0];
    }

    onRequestCreated(request: Request) {
        request.addRequestListener(this);
    }

    onRequestError(request: Request, response: XMLHttpRequest, textStatus: string, errorThrown: any) {
        if ((textStatus == 'error') && (this.status.indexOf(response.status) >= 0)) {
            request.retry();
        }
    }
}