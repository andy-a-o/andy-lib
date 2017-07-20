import {Listeners} from "@andy-lib/util";
import {ContentServerValidator, ContentServerValidatorListener} from "./ContentServerValidator";
import {ContentServer} from "./ContentServer";
import {Resource} from "./Resource";
import {ErrorReporter} from "./ErrorReporter";

export interface ContentServerManagerListener {
    onContentServerManagerInitialized(manager: ContentServerManager);
}

export class ContentServerManager {
    private readonly contentServerManagerListeners = new Listeners<ContentServerManagerListener>([
        "onContentServerManagerInitialized"
    ]);

    private readonly priorityMap: { [priority: number]: ContentServer[] } = {};
    private readonly validators: ContentServerValidator[] = [];
    private readonly initLog = [];
    private serverCount = 0;

    private serverMap?: ContentServer[][] | undefined;

    addValidator(validator: ContentServerValidator) {
        this.validators.push(validator);
    }

    removeValidator(validator: ContentServerValidator) {
        const i = this.validators.indexOf(validator);
        if (i >= 0) {
            this.validators.splice(i, 1);
        }
    }

    addContentServer(contentServer: ContentServer) {
        const p = contentServer.getPriority();
        const map = this.priorityMap;
        if (!map[p]) {
            map[p] = [];
        }
        const i = map[p].indexOf(contentServer);
        if (i < 0) {
            map[p].push(contentServer);
            ++this.serverCount;
        }
    }

    removeContentServer(contentServer: ContentServer) {
        const p = contentServer.getPriority();
        const servers = this.priorityMap[p];
        if (servers) {
            const i = servers.indexOf(contentServer);
            if (i >= 0) {
                servers.splice(i, 1);
                --this.serverCount;
                if (!servers.length) {
                    delete this.priorityMap[p];
                }
            }
        }
    }

    selectContentServer(resource: Resource): ContentServer {
        const loadAttempts = resource.getLoadAttempts();
        let serverMap = this.serverMap;
        if (!serverMap) {
            serverMap = this.serverMap = this.prepareServerMap();
        }
        let servers = serverMap[loadAttempts % serverMap.length];
        if (!servers) {
            ErrorReporter.error(
                "No content server may be selected for resource " + resource.getSrc() + " after " + loadAttempts + " load attempts",
                "ContentServerManager", 89);
            return undefined;
        }
        const i = resource.getSrc().length + loadAttempts;
        return servers[i % servers.length];
    }

    addContentServerManagerListener(l: ContentServerManagerListener) {
        this.contentServerManagerListeners.add(l);
    }

    removeContentServerManagerListener(l: ContentServerManagerListener) {
        this.contentServerManagerListeners.remove(l);
    }

    initialize() {
        const manager = this;
        const validators = this.validators;
        let serversLeft = this.serverCount;
        const validatorListener = {
            onContentServerValid(validator: ContentServerValidator, cs: ContentServer) {
                manager.log("Server " + cs.getBaseUri() + " marked as valid");
                this.serverValidated(validator);
            },
            onContentServerInvalid(validator: ContentServerValidator, cs: ContentServer, reason: string) {
                manager.log("Server " + cs.getBaseUri() + " marked as invalid: " + reason);
                manager.removeContentServer(cs);
                this.serverValidated(validator);
            },
            serverValidated(validator: ContentServerValidator) {
                validator.addValidatorListener(this);
                if (--serversLeft == 0) {
                    manager.fireInitialized();
                }
            }
        } as ContentServerValidatorListener;
        const map = this.priorityMap;
        for (let p in map) {
            if (map.hasOwnProperty(p)) {
                const servers = map[p];
                for (let i = 0, n = servers.length; i < n; ++i) {
                    const server = servers[i];
                    for (let j = 0, k = validators.length; j < k; ++j) {
                        const validator = validators[j];
                        validator.addValidatorListener(validatorListener);
                        validator.validate(server);
                    }
                }
            }
        }
    }

    private prepareServerMap(): ContentServer[][] {
        const serverMap: ContentServer[][] = [];
        const priorityMap = this.priorityMap;
        for (let p in priorityMap) {
            if (priorityMap.hasOwnProperty(p)) {
                const servers = priorityMap[p];
                for (let i = 0, n = servers.length; i < n; ++i) {
                    console.log("Using content server " + servers[i].getBaseUri());
                    serverMap.push(servers);
                }
            }
        }
        if (!serverMap.length) {
            ErrorReporter.error("No content servers available; init log:\n" +
                this.initLog.join("\n"),
                "ContentServerManager", 165);
        }
        return serverMap;
    }

    private fireInitialized() {
        this.contentServerManagerListeners.call("onContentServerManagerInitialized", [this]);
    }

    private log(message: string) {
        this.initLog.push(message);
    }
}