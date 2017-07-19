export class Strings {

    protected constructor() {
    }

    static padRight(string: string, pad: string, length: number): string {
        while (string.length < length) {
            string = string + pad;
        }
        return string;
    }

    static padLeft(string: string, pad: string, length: number): string {
        while (string.length < length) {
            string = pad + string;
        }
        return string;
    }
}