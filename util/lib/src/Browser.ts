export class Browser {
    static mozilla?: string | undefined;
    static opera?: string | undefined;
    static chrome?: string | undefined;
    static webkit?: string | undefined;
    static msie?: string | undefined;
    static safari?: string | undefined;
}

function uaMatch(ua: string): {browser: string, version: string} {
    ua = ua.toLowerCase();
    const match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
        /(webkit)[ \/]([\w.]+)/.exec(ua) ||
        /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
        /(msie) ([\w.]+)/.exec(ua) ||
        ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
        [];
    return {
        browser: match[1] || "",
        version: match[2] || "0"
    };
}

const matched = uaMatch(navigator.userAgent);

if (matched.browser) {
    Browser[matched.browser] = matched.version;
}

// Chrome is Webkit, but Webkit is also Safari.
if (Browser.chrome) {
    Browser.webkit = Browser.chrome;
} else if (Browser.webkit) {
    Browser.safari = Browser.webkit;
}