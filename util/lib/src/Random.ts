export class Random {

    protected constructor() {
    }

    static get(min: number, max: number): number {
        return min + Math.round(Math.random() * (max - min));
    }
}