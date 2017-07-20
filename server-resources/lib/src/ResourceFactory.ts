import {ResourceCache} from "./ResourceCache";
import {Bundle, BundleSpriteConfig} from "./Bundle";
import {Resource, ResourceConfig} from "./Resource";
import {ScriptResource} from "./ScriptResource";
import {VideoResource} from "./VideoResource";
import {ImageBundleResource} from "./ImageBundleResource";
import {BlobImageResource} from "./BlobImageResource";
import {ImageResource} from "./ImageResource";
import {SoundBundleResource} from "./SoundBundleResource";
import {WebAudioSoundResource} from "./WebAudioSoundResource";
import {SoundResource} from "./SoundResource";
import {AbstractBundleResource} from "./AbstractBundleResource";
import {Browser} from "@andy-lib/util";

export class ResourceFactory {
    private readonly cache = new ResourceCache();
    private readonly versioned: { [extension: string]: boolean } = {};
    private readonly bundles: { [name: string]: Bundle<any, any> } = {};

    private loadTimeout?: number | undefined;
    private useNoCacheUrls?: boolean | undefined;
    private currentBundle: Bundle<any, any> | undefined;

    setLoadTimeout(timeout: number) {
        this.loadTimeout = timeout;
    }

    setUseNoCacheUrls(useNoCacheUrls: boolean) {
        this.useNoCacheUrls = useNoCacheUrls;
    }

    setVersionedResourceExtensions(extensions: string[]) {
        for (let i = 0, n = extensions.length; i < n; ++i) {
            this.versioned[extensions[i]] = true;
        }
    }

    addBundle<S extends BundleSpriteConfig>(name: string, sprites: S[]) {
        console.assert(!this.currentBundle, `Cannot add new bundle ${name}: there is an already open bundle: ${this.currentBundle}`);
        let bundle = this.bundles[name];
        if (!bundle) {
            bundle = this.bundles[name] = new Bundle(name);
        }
        bundle.addSprites(sprites);
        this.currentBundle = bundle;
    }

    closeBundle() {
        delete this.currentBundle;
    }

    getCurrentBundle(): Bundle<any, any> {
        return this.currentBundle;
    }

    newResource<C extends ResourceConfig>(res: C) {
        let resource = this.cache.get(res.src);
        if (resource) {
            resource.assign(res);
            return resource;
        }
        const ext = getExt(res.src);
        if (isImage(ext)) {
            resource = this.newImageResource(res);
        } else if (isSound(ext)) {
            resource = this.newSoundResource(res);
        } else if (isVideo(ext)) {
            resource = new VideoResource(res);
        } else if (isScript(ext)) {
            resource = new ScriptResource(res);
        }
        if (resource) {
            resource.setVersioned(this.versioned[ext]);
            this.cache.add(resource);
            this.prepareResource(resource, res);
            resource.assign(res);
        }
        return resource;
    }

    private newImageResource(res: ResourceConfig): Resource {
        const bundle = this.getBundle(res);
        if (bundle) {
            return new ImageBundleResource(res, bundle);
        }
        return blobImagesSupported
            ? new BlobImageResource(res)
            : new ImageResource(res);
    }

    private newSoundResource(res: ResourceConfig): Resource {
        const bundle = this.getBundle(res);
        if (bundle) {
            return new SoundBundleResource(res, bundle);
        }
        if (WebAudioSoundResource.isSupported()) {
            return new WebAudioSoundResource(res);
        }
        const resource = new SoundResource(res);
        resource.setNoCache(!cacheSound);
        return resource;
    }

    private prepareResource(resource: Resource, res: ResourceConfig) {
        if (this.loadTimeout) {
            resource.setTimeout(this.loadTimeout);
        }
        if (this.useNoCacheUrls) {
            resource.setUseNoCacheUrls(true);
        }
        if (this.currentBundle && !(resource instanceof AbstractBundleResource)) {
            this.currentBundle.addResource(resource, res);
        }
    }

    private getBundle(res: ResourceConfig): Bundle<any, any> {
        const bundleName = getBundleName(res);
        if (bundleName) {
            const bundle = this.bundles[bundleName];
            console.assert(!!bundle, `No bundle ${bundleName} found`);
            return bundle;
        }
        return null;
    }
}

const imageFormats = {
    "png": true,
    "jpg": true,
    "jpeg": true,
    "gif": true
};

const videoFormats = {
    "mp4": "video/mp4; codecs=\"avc1.42E01E, mp4a.40.2\"",
    "ogv": "video/ogg; codecs=\"theora, vorbis\"",
    "webm": "video/webm; codecs=\"vp8, vorbis\""
};

function getVideoExt(): string {
    const video = document.createElement("video");
    for (let ext in videoFormats) {
        if (videoFormats.hasOwnProperty(ext)) {
            const mime = videoFormats[ext];
            if (video.canPlayType(mime)) {
                return ext;
            }
        }
    }
    return null;
}

const videoExt = getVideoExt();

function isSound(ext: string): boolean {
    return SoundResource.isSupportedFileExtension(ext);
}

function isVideo(ext: string): boolean {
    return ext === videoExt;
}

function isImage(ext: string): boolean {
    return !!imageFormats[ext];
}

function getScheme(src: string): string {
    const i = src.indexOf(":");
    if (i > 0) {
        return src.substring(0, i);
    }
    return undefined;
}

function getBundleName(res: ResourceConfig): string {
    const scheme = getScheme(res.src);
    if (scheme && (scheme.indexOf("http") < 0)) {
        return scheme;
    }
    return undefined;
}

function isScript(ext: string): boolean {
    return ("js" == ext);
}

function getExt(path: string): string {
    const i = path.lastIndexOf(".");
    const ext = (i !== -1) ? path.substr(i + 1).toLowerCase() : "";
    const j = ext.indexOf("?");
    if (j > 0) {
        return ext.substring(0, j);
    }
    return ext;
}

const cacheSound = !Browser.msie; // IE 10 cannot load many sounds from cache

// FIXME: FF has a bug which causes NS_ERROR_NOT_AVAILABLE
// when drawing images loaded as blob on a canvas
const blobImagesSupported = BlobImageResource.isSupported() && !Browser.mozilla;

function report() {
    if (WebAudioSoundResource.isSupported()) {
        console.debug("Using WebAudioSoundResource");
    } else {
        console.debug("Using SoundResource");
    }
    if (blobImagesSupported) {
        console.debug("Using BlobImageResource");
    } else {
        console.debug("Using ImageResource");
    }
}

report();