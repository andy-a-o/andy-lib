import {HasOpacity} from "@andy-lib/effect";
import {Sound} from "./Sound";

export class VolumeEffectAdapter implements HasOpacity {

    constructor(private sound: Sound<any>) {
    }

    setOpacity(o: number) {
        this.sound.setVolume(o);
    }

    getOpacity(): number {
        return this.sound.getVolume();
    }
}