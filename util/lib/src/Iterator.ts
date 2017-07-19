export class Iterator<T> {
    private index: number = 0;
    private collection: T[];

    constructor(collection: T[] | {}) {
        if (collection instanceof Object) {
            this.collection = [];
            for (let k in collection) {
                this.collection.push(<T>collection[k]);
            }
        } else {
            this.collection = <T[]>collection;
        }
    }

    /**
     * Checks whether the iteration has more elements.
     */
    hasNext(): boolean {
        return (this.index < this.collection.length);
    }

    /**
     * Returns the next element in the iteration.
     *
     * @throws Error The iteration has no more elements
     */
    next(): T {
        if (!this.hasNext()) {
            throw new Error('The iteration has no more elements');
        } else {
            return this.collection[this.index++];
        }
    }
}