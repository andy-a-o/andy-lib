export class LocalStorage {
    private readonly prefix: string;

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    getString(key: string): string {
        return localStorage[this.prefix + key];
    }

    setString(key: string, value: string) {
        localStorage[this.prefix + key] = value;
    }

    getBoolean(key: string, defaultValue?: boolean): boolean {
        if (localStorage[this.prefix + key] !== undefined) {
            return localStorage[this.prefix + key] === 'true';
        }
        return defaultValue || false;
    }

    setBoolean(key: string, value: boolean) {
        localStorage[this.prefix + key] = value;
    }

    getInt(key: string, defaultValue?: number): number | undefined {
        if (localStorage[this.prefix + key] !== undefined) {
            return parseInt(localStorage[this.prefix + key]);
        }
        return defaultValue;
    }

    setInt(key: string, value: number) {
        localStorage[this.prefix + key] = value;
    }

    getFloat(key: string, defaultValue?: number): number | undefined {
        if (localStorage[this.prefix + key] !== undefined) {
            return parseFloat(localStorage[this.prefix + key]);
        }
        return defaultValue;
    }

    setFloat(key: string, value: number) {
        localStorage[this.prefix + key] = value;
    }

    getDate(key: string, defaultValue?: Date): Date | undefined {
        const value = localStorage[this.prefix + key];
        if (value !== undefined) {
            return new Date(parseInt(value));
        }
        return defaultValue;
    }

    setDate(key: string, value: Date) {
        localStorage[this.prefix + key] = value;
    }

    remove(key: string) {
        delete localStorage[this.prefix + key];
    }

    static get(key: string) {
        let storage = LocalStorage.map[key];
        if (!storage) {
            storage = LocalStorage.map[key] = new LocalStorage(key);
        }
        return storage;
    }

    private static localStorage: any = {};
    private static map: {[prefix: string]: LocalStorage} = {};

    static init() {
        try {
            LocalStorage.localStorage = window.localStorage || {};
        } catch (e) {
            console.warn('Local storage disabled', e);
        }
    }
}

LocalStorage.init();