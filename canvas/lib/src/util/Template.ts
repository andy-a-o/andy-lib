export class Template {

    constructor(private template: string = "") {
    }

    setTemplate(template: string) {
        this.template = template;
    }

    getTemplate(): string {
        return this.template;
    }

    interpolate(params: {}) {
        let text = this.template;
        for (let key in params) {
            if (params.hasOwnProperty(key)) {
                text = text.replace(new RegExp(escapeRegExp(`\${${key}}`), 'g'), params[key]);
            }
        }
        return text;
    }
}

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}