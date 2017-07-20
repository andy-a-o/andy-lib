import {None} from "./None";

export class Regular extends None {

    easeIn(t: number, b: number, c: number, d: number): number {
        return c * (t /= d) * t + b;
    }

    easeOut(t: number, b: number, c: number, d: number): number {
        return -c * (t /= d) * (t - 2) + b;
    }

    easeInOut(t: number, b: number, c: number, d: number): number {
        return ((t /= d / 2) < 1) ? (c / 2 * t * t + b) : (-c / 2 * ((--t) * (t - 2) - 1) + b);
    }
}