import {Sound, SoundConfig} from "./Sound";
import {RandomChannelSelector} from "./RandomChannelSelector";
import {SequentialChannelSelector} from "./SequentialChannelSelector";
import {ChannelSelector} from "./ChannelSelector";
import {Timer, TimerListener} from "@andy-lib/util";
import {Profiler} from "@andy-lib/profiler";
import {WebAudioResourceConfig, WebAudioSoundResource} from "@andy-lib/server-resources";

export class WebAudioSound extends Sound<WebAudioResourceConfig> {
    private readonly buffers: AudioBuffer[] = [];
    private readonly bufferSelector: ChannelSelector<AudioBuffer>;
    private readonly fadeOutTimer: Timer;
    private readonly loopSingleSound: boolean;
    private readonly playbacks: Playback[] = [];
    public gainNode?: GainNode | undefined;

    constructor(res: SoundConfig<WebAudioResourceConfig>) {
        super(res);
        const channels = res.channels;
        if (channels instanceof Array) {
            for (let i = 0, n = channels.length; i < n; ++i) {
                this.buffers.push(Sound.select(channels[i]).buffer);
            }
        } else {
            this.buffers.push(Sound.select(res).buffer);
        }
        this.bufferSelector = res.random
            ? new RandomChannelSelector(this.buffers)
            : new SequentialChannelSelector(this.buffers);
        this.loopSingleSound =
            (this.buffers.length == 1)
            && this.isLooping();
        const sound = this;
        this.fadeOutTimer = new Timer();
        this.fadeOutTimer.addTimerListener({
            onTimer() {
                sound.stop();
            }
        });
    }

    pause() {
        const playbacks = this.playbacks;
        for (let i = 0, n = playbacks.length; i < n; ++i) {
            playbacks[i].pause();
        }
    }

    resume() {
        const playbacks = this.playbacks;
        for (let i = 0, n = playbacks.length; i < n; ++i) {
            playbacks[i].resume();
        }
    }

    fadeOut(duration?: number) {
        if (Sound.isMuted(this.getGroup()) || !this.gainNode) {
            this.stop();
            return;
        }
        const gain = this.gainNode.gain;
        const volume = this.getVolume() / 100;
        gain.linearRampToValueAtTime(volume, context.currentTime);
        gain.linearRampToValueAtTime(0, context.currentTime + (duration || 1000) / 1000);
        this.fadeOutTimer.setInterval(duration);
        this.fadeOutTimer.start();
    }

    public fadingOut(): boolean {
        return this.fadeOutTimer.isStarted();
    }

    protected playSound(offset: number, duration?: number) {
//        Profiler.begin('playSound');
        if (this.fadeOutTimer.isStarted()) {
            this.stop();
        }
        let buffer = this.bufferSelector.popChannel();
        if (!buffer) {
            console.error('No buffer!!!');
            Profiler.end('playSound');
            return;
        }
        let gainNode = this.gainNode;
        if (!gainNode) {
            gainNode = this.gainNode = context.createGain();
        }
        gainNode.gain.value = Sound.isMuted(this.getGroup()) ? 0 : this.getVolume() / 100;
        gainNode.connect(outputNode);
        let playback;
        const playbacks = this.playbacks;
        for (let i = 0, n = playbacks.length; i < n; ++i) {
            const p = playbacks[i];
            if (!p.isStarted()) {
                playback = p;
                break;
            }
        }
        if (!playback) {
            playback = new Playback(this, this.loopSingleSound);
            playbacks.push(playback);
        }
        playback.init(buffer, offset, duration);
        playback.start();
//        Profiler.end('playSound');
    }

    protected stopSound() {
        this.fadeOutTimer.stop();
        const playbacks = this.playbacks;
        for (let i = 0, n = playbacks.length; i < n; ++i) {
            playbacks[i].stop();
        }
        this.cleanup();
    }

    /**
     * @param volume 0-100
     */
    protected updateVolume(volume: number) {
        const gainNode = this.gainNode;
        if (gainNode) {
            gainNode.gain.value = volume / 100;
        }
    }

    playbackStopped(playback: Playback) {
        this.bufferSelector.pushBack(playback.getBuffer());
        if (!this.isLooping()) {
            const playbacks = this.playbacks;
            for (let i = 0, n = playbacks.length; i < n; ++i) {
                if (playbacks[i].isStarted()) {
                    return;
                }
            }
            this.cleanup();
        }
    }

    private cleanup() {
        if (this.gainNode) {
            this.gainNode.disconnect();
            delete this.gainNode;
        }
    }

    static isSupported(): boolean {
        return supported;
    }
}

const context: AudioContext = WebAudioSoundResource.getContext();

const supported: boolean = !!context;
const outputNode: DynamicsCompressorNode | undefined =
    context && context.createDynamicsCompressor();

if (context) {
    outputNode.connect(context.destination);
    deprecatedAPIPatch(context);
}

function deprecatedAPIPatch(context: AudioContext) {
    // See http://www.w3.org/TR/webaudio/#DeprecationNotes
    if (!context.createGain) {
        context.createGain = context["createGainNode"];
        const audioNode = context.createBufferSource();
        audioNode["__proto__"].start = audioNode["__proto__"].noteGrainOn;
        audioNode["__proto__"].stop = audioNode["__proto__"].noteOff;
    }
}

export class Playback implements TimerListener {
    private readonly sound: WebAudioSound;
    private readonly loop: boolean;
    private readonly timer: Timer;

    private buffer?: AudioBuffer | undefined;
    private offset?: number | undefined;
    private duration?: number | undefined;
    private paused?: boolean | undefined;
    private sourceNode?: AudioBufferSourceNode | undefined;
    private startTime?: number | undefined;

    constructor(sound: WebAudioSound, loop: boolean) {
        this.sound = sound;
        this.loop = loop;
        this.timer = new Timer();
        this.timer.addTimerListener(this);
    }

    init(buffer: AudioBuffer, offset: number, duration: number) {
        this.buffer = buffer;
        this.offset = offset || 0;
        this.duration = duration || buffer.duration;
    }

    getBuffer(): AudioBuffer {
        return this.buffer;
    }

    start() {
        if (this.isStarted() || this.paused) {
            return;
        }
        const offset = this.offset;
        const duration = this.duration || this.buffer.duration;
        this.timer.setInterval(Math.floor(duration * 1000));
        this.sourceNode = context.createBufferSource();
        this.sourceNode.buffer = this.buffer;
        this.sourceNode.loop = this.loop;
        this.sourceNode.connect(this.sound.gainNode);
        this.sourceNode.start(0, offset, duration);
        if (!this.sourceNode.loop) {
            this.timer.start();
        }
        this.startTime = context.currentTime;
        this.paused = false;
    }

    pause() {
        if (!this.isStarted() || this.paused) {
            return;
        }
        const timePassed = (context.currentTime - this.startTime);
        this.offset += timePassed;
        this.duration -= timePassed;
        this.stop();
        this.paused = true;
    }

    resume() {
        if (!this.paused) {
            return;
        }
        this.paused = false;
        this.start();
    }

    stop() {
        if (!this.isStarted()) {
            return;
        }
        this.timer.stop();
        this.sourceNode.stop(0);
        this.sourceNode.disconnect();
        delete this.sourceNode;
        delete this.startTime;
        this.paused = false;
        this.sound.playbackStopped(this);
    }

    onTimer() {
        const sound = this.sound;
        if (sound.isLooping() && !sound.fadingOut()) {
            sound.play();
        }
        this.stop();
    }

    isStarted(): boolean {
        return !!this.sourceNode;
    }
}