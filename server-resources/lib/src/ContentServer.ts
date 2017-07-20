import {Resource} from "./Resource";

export class ContentServer {
    private readonly errors = {};
    private priority: number = 1;

    constructor(private baseUri: string, private versionSuffix: string) {
        if (this.baseUri.charAt(this.baseUri.length - 1) != '/') {
            this.baseUri += '/';
        }
    }

    getBaseUri(): string {
        return this.baseUri;
    }

    setPriority(priority: number) {
        this.priority = priority;
    }

    getPriority(): number {
        return this.priority;
    }

    getUrl(resource: Resource): string {
        let src = resource.getSrc();
        if (src.charAt(0) == '/') {
            src = src.substring(1);
        }
        let url = this.baseUri + src;
        if (resource.isVersioned() && this.versionSuffix) {
            if (url.indexOf('?') > 0) {
                url += '&v=';
            } else {
                url += '?v=';
            }
            url += this.versionSuffix;
        }
        return url;
    }
}