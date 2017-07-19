export class Arrays {

    protected constructor() {
    }

    static equals<T>(arr1: T[], arr2: T[]): boolean {
        if (arr1.length !== arr2.length) {
            return false;
        }
        for (let i = arr1.length; i--;) {
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }
        return true;
    }

    static compare<T>(arr1: T[], arr2: T[]): number {
        for (let i = 0, n = Math.min(arr1.length, arr2.length); i < n; ++i) {
            const cmp = <any>arr1[i] - <any>arr2[i];
            if (cmp != 0) {
                return cmp;
            }
        }
        return arr1.length - arr2.length;
    }

    static split<T>(array: T[], chunkSize: number): T[][] {
        const arrays = new Array(Math.ceil(array.length / chunkSize));
        let k = 0;
        for (let i = 0, j = array.length; i < j; i += chunkSize) {
            arrays[k++] = array.slice(i, i + chunkSize);
        }
        return arrays;
    }

    static transform<T, R>(array: T[], f: (T) => R): R[] {
        const out = new Array<R>(array.length);
        for (let i = 0, n = array.length; i < n; ++i) {
            out[i] = f(array[i]);
        }
        return out;
    }

    static filter<T>(array: T[], f: (T, number) => boolean): T[] {
        const out: T[] = [];
        for (let i = 0, n = array.length; i < n; ++i) {
            const item = array[i];
            if (f(item, i)) {
                out.push(item);
            }
        }
        return out;
    }

    static countElements<T>(array: T[], p: (T, number) => boolean): number {
        let count = 0;
        for (let i = 0, n = array.length; i < n; ++i) {
            if (p(array[i], i)) {
                ++count;
            }
        }
        return count;
    }

    static find<T>(array: T[], f: (T, number) => boolean): number {
        for (let i = 0, n = array.length; i < n; ++i) {
            const item = array[i];
            if (f(item, i)) {
                return i;
            }
        }
        return -1;
    }

    static diff<T>(a: T[], b: T[]): T[] {
        const result: T[] = [];
        for (let i = 0, n = a.length; i < n; ++i) {
            let found = false;
            for (let j = 0, k = b.length; j < k; ++j) {
                if (a[i] == b[j]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                result.push(a[i]);
            }
        }
        return result;
    }

    static iterate<T>(arr: T[], callback: (T) => void) {
        for (let i = 0, n = arr.length; i < n; ++i) {
            callback(arr[i]);
        }
    }

    static copyTo<T>(source: T[], target: T[]) {
        target.length = source.length;
        for (let i = 0, n = source.length; i < n; ++i) {
            target[i] = source[i];
        }
    }

    static map<T>(source: T[], keyFunc: (T) => any) {
        const result = {};
        for (let i = 0, n = source.length; i < n; ++i) {
            const element = source[i];
            result[keyFunc(element)] = element;
        }
        return result;
    }

    static remove<T>(array: T[], s: T) {
        const i = array.indexOf(s);
        if (i >= 0) {
            array.splice(i, 1);
        }
    }
}