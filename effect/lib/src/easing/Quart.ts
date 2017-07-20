import {None} from "./None";

export class Quart extends None {

    easeIn(t: number, b: number, c: number, d: number): number {
        return c * (t /= d) * t * t * t + b;
    }

    easeOut(t: number, b: number, c: number, d: number): number {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    }

    easeInOut(t: number, b: number, c: number, d: number): number {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
        return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
    }
}