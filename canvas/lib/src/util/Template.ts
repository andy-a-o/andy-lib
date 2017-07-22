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
                text = text.replace(`\${${key}}`, params[key]);
            }
        }
        return text;
    }
}