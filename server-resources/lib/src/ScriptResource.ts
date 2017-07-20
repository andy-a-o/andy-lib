import {Resource} from "./Resource";
import {Request, RequestFactory, RequestListener} from "@andy-lib/server";

export class ScriptResource extends Resource implements RequestListener {

    onRequestCompleted() {
        this.fireLoaded();
    }

    onRequestFailed(request: Request, response: XMLHttpRequest, errorThrown: any) {
        this.fireError(errorThrown);
    }

    protected loadFromUrl(url: string) {
        RequestFactory.newRequest("GET", url)
            .setDataType("script")
            .setCache(true)
            .addRequestListener(this)
            .send();
    }
}