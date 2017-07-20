import {None} from "./None";

export class Back extends None {
    private readonly s: number;

    constructor(s: number) {
        super();
        this.s = s || 1.70158;
    }

    easeIn(t: number, b: number, c: number, d: number): number {
        return c * (t /= d) * t * ((this.s + 1) * t - this.s) + b;
    }

    easeOut(t: number, b: number, c: number, d: number): number {
        return c * ((t = t / d - 1) * t * ((this.s + 1) * t + this.s) + 1) + b;
    }

    easeInOut(t: number, b: number, c: number, d: number): number {
        let s = this.s;
        if ((t /= d / 2) < 1) {
            return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
        } else {
            return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
        }
    }
}