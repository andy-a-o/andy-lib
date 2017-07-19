import {Iterator} from "./Iterator";

export class ArrayList<T> {
    private elements: T[];

    constructor(elements?: T[]) {
        this.elements = elements || [];
    }

    add(element: T) {
        this.elements.push(element);
    }

    indexOf(element: T) {
        for (let i = 0, n = this.elements.length; i < n; ++i) {
            if (element === this.elements[i]) {
                return i;
            }
        }
        return -1;
    }

    get(i: number): T {
        return this.elements[i];
    }

    size(): number {
        return this.elements.length;
    }

    clear() {
        this.elements = [];
    }

    iterator(): Iterator<T> {
        return new Iterator<T>(this.elements);
    }

    toArray(): T[] {
        return this.elements;
    }
}
