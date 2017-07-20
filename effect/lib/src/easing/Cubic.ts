import {None} from "./None";

export class Cubic extends None {

    easeIn(t: number, b: number, c: number, d: number): number {
        return c * (t /= d) * t * t + b;
    }

    easeOut(t: number, b: number, c: number, d: number): number {
        return c * ((t = t / d - 1) * t * t + 1) + b;
    }

    easeInOut(t: number, b: number, c: number, d: number): number {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t + 2) + b;
    }
}