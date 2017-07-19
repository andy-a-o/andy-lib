import {Listeners} from "./Listeners";

export interface ScriptLoadListener {
    onScriptLoaded?(url: string);
    onScriptLoadError?(url: string, error: any);
}

export class ScriptLoader {
    private readonly cache: {[url: string]: boolean} = {};
    private readonly scriptLoaderListeners = new Listeners<ScriptLoadListener>([
        "onScriptLoaded",
        "onScriptLoadError"
    ]);

    addScriptLoaderListener(l: ScriptLoadListener) {
        this.scriptLoaderListeners.add(l);
    }

    removeScriptLoaderListener(l: ScriptLoadListener) {
        this.scriptLoaderListeners.remove(l);
    }

    loadScript(url: string) {
        if (this.cache[url]) {
            this.fireScriptLoaded(url);
            return;
        }
        console.log(Date.now() + ": loading script " + url);
        const script = <any>document.createElement("script");
        const loadCallback = () => {
            console.log(Date.now() + ": script loaded " + url);
            this.fireScriptLoaded(url);
            document.body.removeChild(script);
        };
        const errorCallback = (e) => {
            this.fireLoadError(url, e);
        };
        script.onreadystatechange = () => {
            if (script.readyState === "complete") {
                setTimeout(loadCallback, 0);
            }
        };
        script.onload = loadCallback;
        script.onerror = errorCallback;
        script.type = "text/javascript";
        script.src = url;
        document.body.appendChild(script);
    }

    private fireScriptLoaded(url: string) {
        this.scriptLoaderListeners.call("onScriptLoaded", [url]);
    }

    private fireLoadError(url: string, e: any) {
        this.scriptLoaderListeners.call("onScriptLoadError", [url, e]);
    }
}