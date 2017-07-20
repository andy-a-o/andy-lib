import {AbstractEffect, EffectListener} from "./AbstractEffect";

export class MultiEffect extends AbstractEffect implements EffectListener {
    private readonly effects: AbstractEffect[];
    private counter: number = 0;

    constructor(effects?: AbstractEffect[], delay?: number) {
        super(delay);
        this.effects = [];
        this.counter = 0;
        if (effects) {
            for (let i = 0, n = effects.length; i < n; ++i) {
                this.add(effects[i]);
            }
        }
    }

    add(effect: AbstractEffect) {
        effect.addEffectListener(this);
        this.effects.push(effect);
    }

    get(i: number): AbstractEffect {
        return this.effects[i];
    }

    protected started() {
        super.started();
        const effects = this.effects;
        for (let i = 0, n = effects.length; i < n; ++i) {
            effects[i].play();
        }
        this.counter = effects.length;
    }

    protected paused() {
        super.paused();
        const effects = this.effects;
        for (let i = 0, n = effects.length; i < n; ++i) {
            effects[i].pause();
        }
    }

    protected resumed() {
        super.resumed();
        const effects = this.effects;
        for (let i = 0, n = effects.length; i < n; ++i) {
            effects[i].resume();
        }
    }

    stop(): boolean {
        if (super.stop()) {
            const effects = this.effects;
            for (let i = 0, n = effects.length; i < n; ++i) {
                effects[i].stop();
            }
            this.counter = 0;
            return true;
        }
        return false;
    }

    /**
     * Calls when one of the effects in sequence has finished.
     */
    onEffectFinished() {
        if (--this.counter == 0) {
            this.finished();
        }
    }
}