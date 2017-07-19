import {Iterator} from "./Iterator";

/**
 * The ordered collection (actually it's a list) of unique elements.
 */
export class OrderedSet<T> {
    private elements: T[];

    constructor() {
        this.elements = [];
    }

    add(element: T) {
        if (!this.contains(element)) {
            this.elements = this.elements.slice(); // Copy on write
            this.elements.push(element);
        }
    }

    remove(element: T) {
        const i = this.indexOf(element);
        if (i >= 0) {
            this.elements = this.elements.slice(); // Copy on write
            delete this.elements[i];
            this.elements.splice(i, 1);
        }
    }

    clear() {
        this.elements.length = 0;
    }

    contains(element: T): boolean {
        return this.elements.indexOf(element) >= 0;
    }

    indexOf(element: T): number {
        return this.elements.indexOf(element);
    }

    size(): number {
        return this.elements.length;
    }

    iterator(): Iterator<T> {
        return new Iterator<T>(this.elements);
    }

    toArray(): T[] {
        return this.elements;
    }
}