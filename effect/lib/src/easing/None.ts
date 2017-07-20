import {Easing} from "./Easing";

export class None implements Easing {

    easeIn(t: number, b: number, c: number, d: number): number {
        return c * t / d + b;
    }

    easeOut(t: number, b: number, c: number, d: number): number {
        return c * t / d + b;
    }

    easeInOut(t: number, b: number, c: number, d: number): number {
        return c * t / d + b;
    }

    easeNone(t: number, b: number, c: number, d: number): number {
        return c * t / d + b;
    }
}