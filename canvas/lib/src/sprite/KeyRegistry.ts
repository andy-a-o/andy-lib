import $ from 'jquery';

export interface KeyHandler {
    onKeyPressed(c: string);
}

export class KeyRegistry {
    private readonly id: number;
    private readonly key: string;
    private readonly keyBindings: { [key: string]: KeyHandler[] } = {};

    constructor() {
        this.id = KeyRegistry.nextId++;
        this.key = `keypress.KeyRegistry${this.id}`;
    }

    addKeyBinding(keys: string[], handler: KeyHandler) {
        for (let i = 0, n = keys.length; i < n; ++i) {
            const keyCode = keys[i].toLowerCase();
            let bindings: KeyHandler[] = this.keyBindings[keyCode];
            if (!bindings) {
                bindings = this.keyBindings[keyCode] = [handler];
            } else {
                const j = bindings.indexOf(handler);
                if (j < 0) {
                    bindings.push(handler);
                }
            }
        }
    }

    removeKeyBinding(keys: string[], handler: KeyHandler) {
        for (let i = 0, n = keys.length; i < n; ++i) {
            const keyCode = keys[i];
            const bindings = this.keyBindings[keyCode];
            if (bindings) {
                const j = bindings.indexOf(handler);
                if (j >= 0) {
                    bindings.splice(j, 1);
                }
            }
        }
    }

    bindKeys() {
        $(document).on(this.key, this.handleKeyPress.bind(this));
    }

    unbindKeys() {
        $(document).off(this.key);
    }

    handleKeyPress(e: KeyboardEvent): boolean {
        const key = e.keyCode || e.which;
        const c = String.fromCharCode(key).toLowerCase();
        const handlers = this.keyBindings[c];
        if (handlers) {
            for (let i = 0, n = handlers.length; i < n; ++i) {
                handlers[i].onKeyPressed(c);
            }
            e.preventDefault();
            return false;
        }
        return true;
    }

    private static nextId = 1;
    private static global: KeyRegistry;

    static getGlobalRegistry(): KeyRegistry {
        if (!KeyRegistry.global) {
            KeyRegistry.global = new KeyRegistry();
            KeyRegistry.global.bindKeys();
        }
        return KeyRegistry.global;
    }
}