export class Listeners<T> {

    private map: {[key: string]: T[]};

    constructor(methods: string[]) {
        this.map = {};
        for (let i = 0, n = methods.length; i < n; ++i) {
            this.map[methods[i]] = [];
        }
    }

    add(l: T) {
        const map = this.map;
        for (let key in map) {
            if (map.hasOwnProperty(key) && (typeof l[key] == "function")) {
                let array = map[key];
                if (array.indexOf(l) < 0) {
                    array.push(l);
                }
            }
        }
    }

    remove(l: T) {
        let map = this.map;
        for (let key in map) {
            if (map.hasOwnProperty(key)) {
                let array = map[key];
                let i = array.indexOf(l);
                if (i >= 0) {
                    array.splice(i, 1);
                }
            }
        }
    }

    /**
     * Calls the listeners' method with the specified name. If the listener
     * does not have this method, omits it.
     *
     * @param method name of the method to call.
     * @param args array of arguments.
     */
    call(method: string, args?: any[]) {
        let array = this.map[method];
        if (!array) {
            return;
        }
        array = array.slice();
        for (let i = 0, n = array.length; i < n; ++i) {
            let l = array[i];
            l && l[method].apply(l, args);
        }
    }

    toJSON(): any {
        const o = {};
        const map = this.map;
        for (let key in map) {
            if (map.hasOwnProperty(key)) {
                const array = map[key];
                o[key] = array.length;
            }
        }
        return o;
    }
}