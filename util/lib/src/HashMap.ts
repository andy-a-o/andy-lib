import {OrderedSet} from "./OrderedSet";
import {ArrayList} from "./ArrayList";

export class HashMap<T> {
    private elements: {[key: string]: T};
    private elementCount: number = 0;

    constructor(elements?: {[key: string]: T}) {
        this.elements = elements || {};
    }

    set(key: string, value) {
        if (!this.hasKey(key)) {
            ++this.elementCount;
        }
        this.elements[key] = value;
    }

    get(key: string) {
        return this.elements[key];
    }

    remove(key: string) {
        if (this.hasKey(key)) {
            delete this.elements[key];
            this.elementCount--;
        }
    }

    hasKey(key: string) {
        return (key in this.elements);
    }

    clear() {
        this.elements = {};
    }

    size(): number {
        return this.elementCount;
    }

    getKeys(): OrderedSet<string> {
        // TODO: optimize
        const keys = new OrderedSet<string>();
        const elements = this.elements;
        for (let key in elements) {
            if (elements.hasOwnProperty(key)) {
                keys.add(key);
            }
        }
        return keys;
    }

    getValues(): ArrayList<T> {
        // TODO: optimize
        const values = new ArrayList<T>();
        const elements = this.elements;
        for (let key in elements) {
            if (elements.hasOwnProperty(key)) {
                values.add(elements[key]);
            }
        }
        return values;
    }

    entries(): ArrayList<{key: string, value: T}> {
        // TODO: optimize
        const entries = new ArrayList<{key: string, value: T}>();
        const elements = this.elements;
        for (let key in elements) {
            if (elements.hasOwnProperty(key)) {
                entries.add({key: key, value: elements[key]});
            }
        }
        return entries;
    }

    toObject(): any {
        return this.elements;
    }
}
