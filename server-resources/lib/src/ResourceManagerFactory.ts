import {ContentServerManager, ContentServerManagerListener} from "./ContentServerManager";
import {ContentServerValidatorFactory} from "./ContentServerValidatorFactory";
import {ContentServer} from "./ContentServer";
import {ResourceFactory} from "./ResourceFactory";
import {Listeners} from "@andy-lib/util";
import {ResourceManager} from "./ResourceManager";

export interface ResourceManagerFactoryListener {
    onResourceManagerFactoryInitialized?(factory: ResourceManagerFactory);

    onResourceManagerCreated?(factory: ResourceManagerFactory, manager: ResourceManager);
}

export interface ResourceManagerFactoryConfig {
    version?: string | undefined;
    contentServers?: { [baseUri: string]: number } | undefined;
    contentServerValidators?: { [validatorName: string]: any } | undefined;
    loadAttempts?: number | undefined;
    loadTimeout?: number | undefined;
    noCacheUrls?: string | undefined;
    versionedResources?: string[] | undefined;
}

/**
 * Responsible for loading various model (images, JSON etc) from server.
 */
export class ResourceManagerFactory implements ContentServerManagerListener {
    private readonly resourceManagerFactoryListeners = new Listeners<ResourceManagerFactoryListener>([
        "onResourceManagerFactoryInitialized",
        "onResourceManagerCreated"
    ]);

    private readonly contentServerManager: ContentServerManager;
    private readonly loadAttempts: number;
    private readonly resourceFactory: ResourceFactory;

    constructor(config: ResourceManagerFactoryConfig) {
        const contentServerConfig = config.contentServers || {"": 1};
        const contentServerValidators = config.contentServerValidators || {};
        const contentServerManager = new ContentServerManager();
        const validatorFactory = new ContentServerValidatorFactory();
        for (let baseUri in contentServerConfig) {
            if (contentServerConfig.hasOwnProperty(baseUri)) {
                const cs = new ContentServer(baseUri, config.version);
                cs.setPriority(contentServerConfig[baseUri]);
                contentServerManager.addContentServer(cs);
            }
        }
        for (let validatorName in contentServerValidators) {
            if (contentServerValidators.hasOwnProperty(validatorName)) {
                const validatorConfig = contentServerValidators[validatorName];
                const validator = validatorFactory.newValidator(validatorName, validatorConfig);
                contentServerManager.addValidator(validator);
            }
        }
        this.contentServerManager = contentServerManager;
        this.contentServerManager.addContentServerManagerListener(this);
        this.loadAttempts = config.loadAttempts || 1;
        this.resourceFactory = new ResourceFactory();
        config.loadTimeout && this.resourceFactory.setLoadTimeout(config.loadTimeout);
        this.resourceFactory.setUseNoCacheUrls(!!config.noCacheUrls);
        if (config.versionedResources) {
            this.resourceFactory.setVersionedResourceExtensions(config.versionedResources);
        }
    }

    initialize() {
        this.contentServerManager.initialize();
    }

    onContentServerManagerInitialized() {
        this.fireInitialized();
    }

    addResourceManagerFactoryListener(l: ResourceManagerFactoryListener) {
        this.resourceManagerFactoryListeners.add(l);
    }

    removeResourceManagerFactoryListener(l: ResourceManagerFactoryListener) {
        this.resourceManagerFactoryListeners.remove(l);
    }

    setLoadTimeout(timeout: number) {
        this.resourceFactory.setLoadTimeout(timeout);
    }

    newResourceManager(): ResourceManager {
        const resourceManager = new ResourceManager(this.contentServerManager, this.resourceFactory);
        resourceManager.setLoadAttempts(this.loadAttempts);
        this.fireResourceManagerCreated(resourceManager);
        return resourceManager;
    }

    private fireInitialized() {
        this.resourceManagerFactoryListeners.call("onResourceManagerFactoryInitialized", [this]);
    }

    private fireResourceManagerCreated(resourceManager: ResourceManager) {
        this.resourceManagerFactoryListeners.call("onResourceManagerCreated", [this, resourceManager]);
    }
}