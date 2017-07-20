import {md5hex} from "@andy-lib/util";
import {RequestFactoryListener} from "./RequestFactory";
import {Request, RequestListener} from "./Request";

export class RequestVerifier implements RequestFactoryListener, RequestListener {
    private salt: string;

    constructor(salt?: string) {
        this.salt = salt || "";
    }

    onRequestCreated(request: Request) {
        request.addRequestListener(this);
    }

    onRequestBeforeSend(request: Request) {
        const data = request.getData();
        if (data) {
            const f = md5hex;
            const s = this.salt;
            const h = String.fromCharCode.apply(null, RequestVerifier.HEADER);
            request.addHeader(h, f(f(JSON.stringify(data)) + s));
        }
    }

    private static HEADER = [88, 45, 82, 69, 81, 85, 69, 83, 84, 45, 83, 73, 71];
}