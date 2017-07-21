import {Listeners, Timer, TimerListener} from "@andy-lib/util";
import {SoundResource, SoundResourceConfig} from "@andy-lib/server-resources";

export interface MuteListener {
    onSoundMuted?(group: string);

    onSoundUnmuted?(group: string);
}

export interface SoundChannelConfig<C extends SoundResourceConfig> {
    ogg?: C | undefined;
    mp3?: C | undefined;
}

export interface SoundConfig<C extends SoundResourceConfig> extends SoundChannelConfig<C> {
    volume?: number | undefined;
    looping?: boolean | undefined;
    group?: string | undefined;
    delay?: number | undefined;
    channels: SoundChannelConfig<C>[] | number | undefined;
    random?: boolean | undefined;
    duration?: number | undefined;
    offset?: number | undefined;
}

const muteMap = {};

const listeners = new Listeners<MuteListener>([
    "onSoundMuted",
    "onSoundUnmuted"
]);

export abstract class Sound<C extends SoundResourceConfig> implements TimerListener, MuteListener {
    private volume: number;
    private offset: number;
    private duration: number;
    private looping: boolean;
    private group: string;
    private readonly timer: Timer;

    constructor(res: SoundConfig<C>) {
        this.volume = (res.volume !== undefined) ? res.volume : 100;
        this.offset = res.offset || 0;
        this.duration = res.duration || undefined;
        this.looping = !!res.looping;
        this.group = res.group || Sound.DEFAULT;
        this.timer = new Timer(res.delay || 0);
        this.timer.addTimerListener(this);
        Sound.addMuteListener(this);
    }

    init() {
        if (Sound.isMuted(this.group)) {
            this.updateVolume(0);
        }
    }

    onSoundMuted(group: string) {
        if (group == this.group) {
            this.updateVolume(0);
        }
    }

    onSoundUnmuted(group: string) {
        if (group == this.group) {
            this.updateVolume(this.volume);
        }
    }

    setGroup(group: string) {
        this.group = group;
    }

    getGroup(): string {
        return this.group;
    }

    isLooping(): boolean {
        return this.looping;
    }

    /**
     * @param volume 0-100
     */
    setVolume(volume: number) {
        if (this.volume != volume) {
            this.volume = volume;
            if (!Sound.isMuted(this.group)) {
                this.updateVolume(this.volume);
            }
        }
    }

    getVolume(): number {
        return this.volume;
    }

    onTimer(timer: Timer) {
        timer.stop();
        if (!this.fadingOut()) {
            this.playSound(this.offset, this.duration);
        }
    }

    play() {
        this.timer.start();
    }

    stop() {
        this.timer.stop();
        this.stopSound();
    }

    abstract pause();

    abstract resume();

    /**
     * @param duration Time in milliseconds.
     */
    abstract fadeOut(duration?: number);

    /**
     * @param offset Number of seconds
     * @param duration Number of milliseconds
     */
    protected abstract playSound(offset: number, duration?: number);

    protected abstract stopSound();

    /**
     * @param volume 0-100
     */
    protected abstract updateVolume(volume: number);

    protected fadingOut(): boolean {
        return false;
    }

    static DEFAULT: string = "default";

    static addMuteListener(l: MuteListener) {
        listeners.add(l);
    }

    static removeMuteListener(l: MuteListener) {
        listeners.remove(l);
    }

    static setMuted(muted: boolean, group: string = Sound.DEFAULT) {
        const wasMuted = muteMap[group];
        if (wasMuted != muted) {
            muteMap[group] = muted;
            if (muted) {
                fireMuted(group);
            } else {
                fireUnmuted(group);
            }
        }
    }

    static isMuted(group: string = Sound.DEFAULT): boolean {
        return !!muteMap[group];
    }

    static select<T extends SoundResourceConfig>(res: SoundChannelConfig<T>): T {
        return res[SoundResource.format];
    }
}

function fireMuted(group) {
    listeners.call("onSoundMuted", [group]);
}

function fireUnmuted(group) {
    listeners.call("onSoundUnmuted", [group]);
}