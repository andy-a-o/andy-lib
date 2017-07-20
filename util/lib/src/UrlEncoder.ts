export class UrlEncoder {

    /**
     * Replaces all special URI symbols with its hexadecimal numbers.
     */
    static encode(url: string): string {
        if (!url) return '';
        url = encodeURI(url);
        url = url.replace(/\+/g, '%2B');
        url = url.replace(/#/g, '%23');
        url = url.replace(/\?/g, '%3F');
        url = url.replace(/&amp;/g, '%26');
        return url;
    }
}