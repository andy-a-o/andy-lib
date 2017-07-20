import {ContentServerValidator} from "./ContentServerValidator";
import {ContentServer} from "./ContentServer";
import {ImageResource, ImageResourceConfig} from "./ImageResource";

export class CORSValidator extends ContentServerValidator {

    constructor(private url: string) {
        super();
    }

    validate(contentServer: ContentServer) {
        const validator = this;
        const resource = new ImageResource({src: this.url, init: "render"});
        resource.addResourceListener({
            onResourceLoaded(resource: ImageResource) {
                resource.initialize();
            },
            onResourceInitialized(resource: ImageResource) {
                const res = {} as ImageResourceConfig;
                resource.assign(res);
                try {
                    res.canvas.getContext("2d").getImageData(0, 0, 1, 1);
                    console.info(`Content server ${contentServer.getBaseUri()} supports CORS; validation passed`);
                    validator.fireValid(contentServer);
                } catch (e) {
                    validator.fireInvalid(contentServer,
                        resource.getSrc() + " tainted canvas");
                }
            },
            onResourceInitializeError(resource: ImageResource) {
                validator.fireInvalid(contentServer, `${resource.getSrc()} init failed`);
            },
            onResourceLoadError(resource: ImageResource) {
                validator.fireInvalid(contentServer, `${resource.getSrc()} load failed`);
            }
        });
        resource.load(contentServer.getUrl(resource), true);
    }
}