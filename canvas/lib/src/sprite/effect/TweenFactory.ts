import {AnimationFrameTimerFactory} from "./AnimationFrameTimerFactory";
import {
    AbstractEffect,
    Back,
    Blink,
    Bounce,
    Circ,
    Cubic,
    Easing,
    EasingType,
    EffectListener,
    EffectSequence,
    Elastic,
    Expo,
    FadeIn,
    FadeOut,
    HasOpacity,
    HasScale,
    HasVisibility,
    LinearMotion,
    MultiEffect,
    None,
    Quart,
    Quint,
    Regular,
    Scale,
    Sine,
    Strong,
    Tween
} from "@andy-lib/effect";
import {TimerFactory} from "./TimerFactory";
import {DisplayObject} from "../DisplayObject";
import {AdvancedLinearMotion, AdvancedLinearMotionConfig} from "./AdvancedLinearMotion";
import {Stage} from "../Stage";
import {Arrays} from "@andy-lib/util";
import {FakeEffect} from "./FakeEffect";
import {PauseController} from "../../PauseController";
import {MotionAdapter} from "./MotionAdapter";

export interface TweenEventActionConfig {
    play?: string[] | undefined;
    stop?: string[] | undefined;
    pause?: string[] | undefined;
    resume: string[] | undefined;
}

export interface TweenConfig {
    id?: string | undefined;
    time?: number | undefined;
    interval?: number | undefined;
    autoplay?: boolean | undefined;
    looping?: boolean | undefined;
    type?: string | undefined;
    easing?: { [name: string]: string } | undefined;
    delay?: number | undefined;
    nopause?: boolean | undefined;
    start?: number | undefined;
    end?: number | undefined;
    effects?: TweenConfig[] | undefined;
    onplaybackstart?: TweenEventActionConfig | undefined;
    onstart?: TweenEventActionConfig | undefined;
    onfinish?: TweenEventActionConfig | undefined;
}

export class TweenFactory {
    private readonly defaults: TweenConfig;
    private readonly tweens: { [id: string]: AbstractEffect[] } = {};
    private timerFactory: TimerFactory = new AnimationFrameTimerFactory();

    constructor(defaults?: TweenConfig) {
        this.defaults = {interval: 10, time: 1000, ...(defaults || {})};
        this.tweens = {};
    }

    setTimerFactory(factory: TimerFactory) {
        this.timerFactory = factory;
    }

    newTween(target: any, res: TweenConfig): AbstractEffect {
        const tween = this.createTween(target, res);
        if (res.autoplay) {
            target.addObjectListener({
                onObjectAdded(target: DisplayObject, stage: Stage) {
                    stage.addStageListener(this);
                    if (stage.isStarted()) {
                        tween.play();
                    }
                },
                onObjectRemoved(target: DisplayObject, stage: Stage) {
                    stage.removeStageListener(this);
                    tween.stop();
                },
                onStageStarted(stage: Stage) {
                    tween.play();
                },
                onStageStopped(stage: Stage) {
                    tween.stop();
                }
            });
            if (target.getStage()) {
                tween.play();
            }
        }
        this.registerTween(tween, res);
        return tween;
    };

    createTween(target: any, res: TweenConfig): AbstractEffect {
        switch (res.type) {
            case "linearMotion":
                return this.newLinearMotion(target, res);
            case "fadeOut":
                return this.newFadeOut(<HasOpacity>target, res);
            case "fadeIn":
                return this.newFadeIn(<HasOpacity>target, res);
            case "blink":
                return this.newBlink(target, res);
            case "scale":
                return this.newScale(target, res);
            case "sequence":
                return this.newEffectSequence(target, res);
            case "sync":
                return this.newMultiEffect(target, res);
            case "none":
                return this.newFakeEffect(target, res);
            default:
                throw new Error("Unknown effect type: " + res.type);
        }
    };

    newLinearMotion(target: DisplayObject, res: TweenConfig): LinearMotion {
        res = this.applyDefaults(res);
        const motion = new AdvancedLinearMotion(
            new MotionAdapter(target),
            res.time || this.defaults.time,
            this.timerFactory.newTimer(),
            getEasing(res.easing),
            getEasingType(res.easing),
            <AdvancedLinearMotionConfig>res);
        motion.addEffectListener({
            onEffectFinished: function () {
                target.updateCoords();
            }
        });
        applyDelay(motion, res.delay);
        addPauseListener(motion, res.nopause);
        return motion;
    }

    newFadeOut(target: HasOpacity, res: TweenConfig): FadeOut {
        res = this.applyDefaults(res);
        const fadeOut = new FadeOut(
            target,
            res.time || this.defaults.time,
            this.timerFactory.newTimer(),
            getEasing(res.easing),
            getEasingType(res.easing));
        fadeOut.addEffectListener({
            onEffectPlaybackStarted(effect: Tween) {
                effect.setStartPosition((res.end !== undefined) ? res.end : 0);
                effect.setEndPosition((res.start !== undefined) ? res.start : target.getOpacity());
            }
        });
        applyDelay(fadeOut, res.delay);
        addPauseListener(fadeOut, res.nopause);
        return fadeOut;
    }

    newFadeIn(target: HasOpacity, res: TweenConfig): FadeIn {
        res = this.applyDefaults(res);
        const fadeIn = new FadeIn(
            target,
            res.time || this.defaults.time,
            this.timerFactory.newTimer(),
            getEasing(res.easing),
            getEasingType(res.easing));
        fadeIn.addEffectListener({
            onEffectPlaybackStarted(effect: Tween) {
                effect.setStartPosition((res.start !== undefined) ? res.start : target.getOpacity());
                effect.setEndPosition((res.end !== undefined) ? res.end : 100);
            }
        });
        applyDelay(fadeIn, res.delay);
        addPauseListener(fadeIn, res.nopause);
        return fadeIn;
    }

    newScale(target: HasScale, res: TweenConfig): Scale {
        res = this.applyDefaults(res);
        const scale = applyDelay(new Scale(
            target,
            res.time || this.defaults.time,
            this.timerFactory.newTimer(),
            res.start || 100,
            res.end || 100,
            getEasing(res.easing),
            getEasingType(res.easing)),
            res.delay);
        addPauseListener(scale, res.nopause);
        return scale;
    }

    newBlink(target: HasVisibility, res: TweenConfig): Blink {
        res = this.applyDefaults(res);
        const blink = applyDelay(new Blink(
            target, res.time || this.defaults.time,
            this.timerFactory.newTimer()),
            res.delay);
        addPauseListener(blink, res.nopause);
        return blink;
    }

    newEffectSequence(target: any, res: TweenConfig): EffectSequence {
        const seq = new EffectSequence();
        if (res.looping) {
            seq.setLooping(true);
        }
        const effects = res.effects;
        for (let i = 0, n = effects.length; i < n; ++i) {
            seq.add(this.newTween(target, effects[i]));
        }
        return applyDelay(seq, res.delay);
    }

    newMultiEffect(target: any, res: TweenConfig) {
        const effect = new MultiEffect();
        const effects = res.effects;
        for (let i = 0, n = effects.length; i < n; ++i) {
            effect.add(this.newTween(target, effects[i]));
        }
        return applyDelay(effect, res.delay);
    }

    newFakeEffect(target: any, res: TweenConfig): AbstractEffect {
        res = this.applyDefaults(res);
        let effect = new FakeEffect(
            res.time || this.defaults.time,
            this.timerFactory.newTimer(),
            res.delay);
        effect = applyDelay(effect, res.delay);
        addPauseListener(effect, res.nopause);
        return effect;
    }

    private applyDefaults(res: TweenConfig): any {
        return {...this.defaults, ...res};
    }

    registerTween(tween: AbstractEffect, res: TweenConfig): AbstractEffect {
        if (res.id) {
            if (!this.tweens[res.id]) {
                this.tweens[res.id] = [];
            }
            this.tweens[res.id].push(tween);
        }
        if (res.onplaybackstart || res.onstart || res.onfinish) {
            const listener = {} as EffectListener;
            if (res.onplaybackstart) {
                listener.onEffectFinished = this.makeListener(res.onplaybackstart);
            }
            if (res.onstart) {
                listener.onEffectStarted = this.makeListener(res.onstart);
            }
            if (res.onfinish) {
                listener.onEffectFinished = this.makeListener(res.onfinish);
            }
            tween.addEffectListener(listener);
        }
        return tween;
    }

    private makeListener(action: TweenEventActionConfig): (effect: AbstractEffect) => void {
        return () => {
            const tweens = this.tweens;
            if (action.play) {
                iterate(tweens, action.play, (tween: AbstractEffect) => {
                    tween.play()
                });
            }
            if (action.stop) {
                iterate(tweens, action.stop, (tween: AbstractEffect) => {
                    tween.stop()
                });
            }
            if (action.pause) {
                iterate(tweens, action.pause, (tween: AbstractEffect) => {
                    tween.pause()
                });
            }
            if (action.resume) {
                iterate(tweens, action.resume, (tween: AbstractEffect) => {
                    tween.resume()
                });
            }
        };
    }

}

function iterate(tweens: { [id: string]: AbstractEffect[] }, ids: string[], callback: (tween: AbstractEffect) => void) {
    if (!(ids instanceof Array)) {
        ids = [ids];
    }
    for (let i = 0, n = ids.length; i < n; ++i) {
        const arr = tweens[ids[i]];
        arr && Arrays.iterate(arr, callback);
    }
}

function getEasing(easing: { [key: string]: string | number }): Easing {
    for (let key in easing) {
        if (easing.hasOwnProperty(key)) {
            switch (key) {
                case "back":
                    return new Back(<number>easing["s"]);
                case "bounce":
                    return new Bounce();
                case "circ":
                    return new Circ();
                case "cubic":
                    return new Cubic();
                case "elastic":
                    return new Elastic(<number>easing["s"]);
                case "expo":
                    return new Expo();
                case "quart":
                    return new Quart();
                case "quint":
                    return new Quint();
                case "regular":
                case "quad":
                    return new Regular();
                case "sine":
                    return new Sine();
                case "strong":
                    return new Strong();
                case "none":
                    return new None();
            }
        }
    }
    return new None();
}

function getEasingType(easing: { [key: string]: string | number }): EasingType {
    for (let key in easing) {
        if (easing.hasOwnProperty(key)) {
            switch (easing[key]) {
                case "in":
                    return "easeIn";
                case "out":
                    return "easeOut";
                case "inout":
                    return "easeInOut";
                case "none":
                    return "easeNone";
            }
        }
    }
    return "easeNone";
}

function applyDelay<T extends AbstractEffect>(effect: T, delay?: number): T {
    effect.setDelay(delay || 0);
    return effect;
}

function addPauseListener<T extends AbstractEffect>(effect: T, nopause?: boolean): T {
    if (nopause) {
        return effect;
    }
    const listener = {
        onEffectPlaybackStarted() {
            PauseController.addPauseListener(this);
        },
        onEffectFinished() {
            PauseController.removePauseListener(this);
        },
        onGamePaused() {
            effect.pause();
        },
        onGameResumed() {
            effect.resume();
        }
    };
    effect.addEffectListener(<EffectListener>listener);
    return effect;
}