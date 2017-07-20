export interface Easing {

    easeIn(t: number, b: number, c: number, d: number): number;

    easeOut(t: number, b: number, c: number, d: number): number;

    easeInOut(t: number, b: number, c: number, d: number): number;

    easeNone(t: number, b: number, c: number, d: number): number;
}