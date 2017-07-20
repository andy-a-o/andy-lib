import {AbstractEffect, EffectListener} from "./AbstractEffect";
import {ArrayList, Iterator} from "@andy-lib/util";

export class EffectSequence extends AbstractEffect implements EffectListener {
    private readonly effects = new ArrayList<AbstractEffect>();
    private looping: boolean | undefined;
    private iterator: Iterator<AbstractEffect>;
    private currentEffect: AbstractEffect;

    constructor(effects?: AbstractEffect[], delay?: number) {
        super(delay);
        if (effects) {
            for (let i = 0, n = effects.length; i < n; ++i) {
                this.add(effects[i]);
            }
        }
    }

    setLooping(looping: boolean) {
        this.looping = looping;
    }

    add(effect: AbstractEffect) {
        effect.addEffectListener(this);
        this.effects.add(effect);
    }

    get(i: number): AbstractEffect {
        return this.effects.get(i);
    }

    isPlaying(): boolean {
        for (let i = this.effects.iterator(); i.hasNext();) {
            if (i.next().isPlaying()) {
                return true;
            }
        }
        return false;
    }

    protected started() {
        super.started();
        this.iterator = this.effects.iterator();
        const firstEffect = this.iterator.next();
        const sequence = this;
        firstEffect.addEffectListener({
            onEffectStarted(effect: AbstractEffect) {
                effect.removeEffectListener(this);
                sequence.fireStarted();
            }
        });
        firstEffect.play();
    }

    protected stopped() {
        super.stopped();
        this.currentEffect && this.currentEffect.stop();
    }

    protected paused() {
        super.paused();
        this.currentEffect && this.currentEffect.pause();
    }

    protected resumed() {
        super.resumed();
        this.currentEffect && this.currentEffect.resume();
    }

    /**
     * Calls when one of the effects in sequence has finished.
     */
    onEffectFinished(effect: AbstractEffect) {
        if (this.iterator.hasNext()) {
            this.iterator.next().play();
        } else {
            if (this.looping) {
                this.iterator = this.effects.iterator();
                this.iterator.next().play();
            } else {
                this.finished();
            }
        }
    }

    onEffectPlaybackStarted(e: AbstractEffect) {
        this.currentEffect = e;
    }
}
