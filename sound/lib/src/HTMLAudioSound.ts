import {Sound, SoundChannelConfig, SoundConfig} from "./Sound";
import {Browser, Timer} from "@andy-lib/util";
import {RandomChannelSelector} from "./RandomChannelSelector";
import {ChannelSelector} from "./ChannelSelector";
import {SequentialChannelSelector} from "./SequentialChannelSelector";
import {FadeOut, Strong} from "@andy-lib/effect";
import {VolumeEffectAdapter} from "./VolumeEffectAdapter";
import {SoundResourceConfig} from "@andy-lib/server-resources";

const FADE_OUT_NOT_SUPPORTED: boolean = !!Browser.opera;
const PREV_STOP_REQUIRED: boolean = !!Browser.opera;

const PLAY_DELAY: number =
    Browser.webkit ? -25 :
        Browser.mozilla ? -25 :
            Browser.opera ? 5 : -25;

const STOP_DELAY: number =
    Browser.webkit ? 25 :
        Browser.mozilla ? 85 :
            Browser.opera ? 0 : 0;

export class HTMLAudioSound extends Sound<SoundResourceConfig> {
    private readonly loopTimer: Timer;
    private readonly stopTimer: Timer;
    private readonly channels: HTMLAudioElement[];
    private readonly channelSelector: ChannelSelector<HTMLAudioElement>;

    private currentChannel?: HTMLAudioElement | undefined;
    private previousChannel?: HTMLAudioElement | undefined;

    fadeOutEffect?: FadeOut | undefined;

    constructor(res: SoundConfig<SoundResourceConfig>) {
        super(res);
        const sound = this;
        this.loopTimer = new Timer();
        this.loopTimer.addTimerListener({
            onTimer() {
                sound.play();
            }
        });
        this.stopTimer = new Timer();
        this.stopTimer.addTimerListener({
            onTimer(timer: Timer) {
                timer.stop();
                sound.stopSound();
            }
        });
        this.channels = (res.channels instanceof Array)
            ? this.initFromPredefinedChannels(res.channels)
            : this.multiplyChannel(Sound.select(res), <number>res.channels || 1);
        this.channelSelector = res.random
            ? new RandomChannelSelector(this.channels)
            : new SequentialChannelSelector(this.channels);
    }

    protected stopSound() {
        this.loopTimer.stop();
        this.stopTimer.stop();
        delete this.previousChannel;
        if (this.currentChannel) {
            this.currentChannel.pause();
            this.channelSelector.pushBack(this.currentChannel);
            delete this.currentChannel;
        }
    }

    pause() {
        this.loopTimer.pause();
        this.stopTimer.pause();
        if (this.currentChannel) {
            this.currentChannel.pause();
        }
    }

    resume() {
        this.loopTimer.resume();
        this.stopTimer.resume();
        if (this.currentChannel && this.currentChannel.paused) {
            this.currentChannel.play();
        }
    }

    /**
     * @param duration Time in milliseconds.
     */
    fadeOut(duration?: number) {
        if (FADE_OUT_NOT_SUPPORTED) {
            this.stop();
            return;
        }
        const sound = this;
        const volume = this.getVolume();
        const effect = new FadeOut(new VolumeEffectAdapter(this), duration || 1000, new Timer(10), new Strong(), "easeOut");
        effect.addEffectListener({
            onEffectFinished() {
                sound.setVolume(volume);
                sound.stop();
                delete sound.fadeOutEffect;
            }
        });
        effect.play();
        this.fadeOutEffect = effect;
    }

    protected fadingOut(): boolean {
        const fadeOutEffect = this.fadeOutEffect;
        return fadeOutEffect && this.fadeOutEffect.isPlaying();
    }

    protected playSound(offset: number, duration?: number) {
        if (this.currentChannel && PREV_STOP_REQUIRED) {
            this.currentChannel.pause();
            this.channelSelector.pushBack(this.currentChannel);
        }
        const c = this.currentChannel = this.channelSelector.popChannel();
        if (c) {
            if (this.isLooping()) {
                this.loopTimer.setInterval(Math.floor((c.duration * 1000) + PLAY_DELAY));
                this.loopTimer.start();
            }
            try {
                c.currentTime = offset;
            } catch (e) { // Hello from Opera!
                console.error(e);
            }
            c.play();
            if (duration) {
                this.stopTimer.setInterval(Math.floor(duration * 1000));
                this.stopTimer.start();
            }
        } else {
            console.warn("No sound!");
        }
    }

    private playbackEnded(sound: HTMLAudioElement) {
        this.channelSelector.pushBack(sound);
    }

    /**
     * @param volume 0-100
     */
    protected updateVolume(volume: number) {
        volume /= 100;
        const channels = this.channels;
        for (let i = 0, n = channels.length; i < n; ++i) {
            channels[i].volume = volume;
        }
    }

    private registerChannel(c: HTMLAudioElement) {
        c.onended = e => {
            this.playbackEnded(<HTMLAudioElement>e.target);
        };
    }

    private initFromPredefinedChannels(res: SoundChannelConfig<SoundResourceConfig>[]): HTMLAudioElement[] {
        const channels = [];
        for (let i = 0, n = res.length; i < n; ++i) {
            const c = Sound.select(res[i]).snd;
            this.registerChannel(c);
            channels.push(c);
        }
        return channels;
    }

    private multiplyChannel(res: SoundResourceConfig, cnum: number): HTMLAudioElement[] {
        const channels: HTMLAudioElement[] = [];
        const origin = res.snd;
        channels.push(origin);
        this.registerChannel(origin);
        for (let i = 1; i < cnum; ++i) {
            const c = new Audio(origin.src);
            this.registerChannel(c);
            c.load();
            channels.push(c);
        }
        return channels;
    }
}
