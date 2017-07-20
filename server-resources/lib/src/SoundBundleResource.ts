import {AbstractBundleResource} from "./AbstractBundleResource";
import {BundleConfig, BundleSpriteConfig} from "./Bundle";
import {SoundResourceConfig} from "./SoundResource";
import {WebAudioResourceConfig} from "./WebAudioSoundResource";

export interface SoundBundleSpriteConfig extends BundleSpriteConfig, SoundResourceConfig, WebAudioResourceConfig {
}

export interface SoundBundleConfig extends BundleConfig<SoundBundleSpriteConfig>, SoundResourceConfig, WebAudioResourceConfig {
}

export class SoundBundleResource extends AbstractBundleResource<SoundBundleConfig, SoundBundleSpriteConfig> {

    protected assignToResource(res: SoundResourceConfig & WebAudioResourceConfig, sprite: SoundBundleSpriteConfig, bundleResources: SoundBundleConfig[]) {
        const bundle = bundleResources[0];
        if (bundle.snd) {
            res.snd = bundle.snd;
        }
        if (bundle.buffer) {
            res.buffer = bundle.buffer;
        }
        res.offset = sprite.offset;
        res.duration = sprite.duration;
    }
}