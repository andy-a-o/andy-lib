export interface URLComponents {
    scheme: string;
    host: string;
    port: number | undefined;
    user: string | undefined;
    password: string | undefined;
    path: string;
    query: string;
    fragment: string | undefined;
}

export class UrlParser {

    static parse(url: string): URLComponents {
        const addr = {
            scheme: 'http',
            host: '',
            path: '/',
            query: '',
            fragment: ''
        } as URLComponents;
        // Scheme
        let i = url.indexOf('://');
        if (i != -1) {
            addr.scheme = url.slice(0, i);
            url = url.slice(i + 3);
        }
        i = url.indexOf('/');
        if (i != -1) {
            let part = url.slice(0, i);
            url = url.slice(i);
            // Username and password
            i = part.indexOf('@');
            if (i != -1) {
                const accessKeys = part.slice(0, i).split(':');
                addr.user = accessKeys[0];
                addr.password = (accessKeys[1]) ? accessKeys[1] : '';
                part = part.slice(i + 1);
            }
            // Port number
            i = part.indexOf(':');
            if (i != -1) {
                addr.port = parseInt(part.slice(i + 1));
                part = part.slice(0, i);
            }
            addr.host = part;
        }
        // Fragment
        i = url.indexOf('#');
        if (i != -1) {
            addr.fragment = url.slice(i + 1);
            url = url.slice(0, i);
        }
        // Query string
        i = url.indexOf('?');
        if (i != -1) {
            addr.query = url.slice(i + 1);
            url = url.slice(0, i);
        }
        addr.path = url;
        return addr;
    }

    static parseQuery(url): { [key: string]: string } {
        const params = {};
        const q = UrlParser.parse(url).query;
        const kv = q.split('&');
        for (let i = 0, n = kv.length; i < n; ++i) {
            const arr = kv[i].split('=');
            const key = decodeURIComponent(arr[0]).replace(/\+/g, " ");
            const value = decodeURIComponent(arr[1]).replace(/\+/g, " ");
            if (params.hasOwnProperty(key)) {
                const param = params[key];
                if (!(param instanceof Array)) {
                    params[key] = [param];
                }
                params[key].push(value);
            } else {
                params[key] = value;
            }
        }
        return params;
    }
}