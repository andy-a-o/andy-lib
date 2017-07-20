import {ContentServer} from "./ContentServer";
import {Listeners} from "@andy-lib/util";

export interface ContentServerValidatorListener {
    onContentServerValid?(validator: ContentServerValidator, server: ContentServer);

    onContentServerInvalid?(validator: ContentServerValidator, server: ContentServer, reason: string);
}

export abstract class ContentServerValidator {
    private readonly validatorListeners = new Listeners<ContentServerValidatorListener>([
        "onContentServerValid",
        "onContentServerInvalid"
    ]);

    addValidatorListener(l: ContentServerValidatorListener) {
        this.validatorListeners.add(l);
    }

    removeValidatorListener(l: ContentServerValidatorListener) {
        this.validatorListeners.remove(l);
    }

    abstract validate(contentServer: ContentServer);

    protected fireValid(contentServer: ContentServer) {
        this.validatorListeners.call("onContentServerValid", [this, contentServer]);
    }

    protected fireInvalid(contentServer: ContentServer, reason: string) {
        console.warn(reason);
        console.warn(`Marking content server ${contentServer.getBaseUri()} as invalid`);
        this.validatorListeners.call("onContentServerInvalid", [this, contentServer, reason]);
    }
}