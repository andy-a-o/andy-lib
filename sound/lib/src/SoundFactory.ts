import {WebAudioSound} from "./WebAudioSound";
import {HTMLAudioSound} from "./HTMLAudioSound";
import {Sound, SoundConfig} from "./Sound";

export class SoundFactory {

    protected constructor() {
    }

    static create(res: SoundConfig<any>): Sound<any> {
        let sound;
        if (WebAudioSound.isSupported()) {
            sound = new WebAudioSound(res);
        } else {
            sound = new HTMLAudioSound(res);
        }
        sound.init();
        return sound;
    }
}

function report() {
    if (WebAudioSound.isSupported()) {
        console.debug("Using WebAudioSound");
    } else {
        console.debug("Using HTMLAudioSound");
    }
}

report();