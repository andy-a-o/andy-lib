export class FontLoader {

    constructor(private baseUri: string) {
    }

    load(res: any) {
        for (let name in res) {
            if (res.hasOwnProperty(name)) {
                const location = res[name];
                const fileUri = `${this.baseUri}/${location}/${name}`;
                const style = document.createElement('style');
                style.innerHTML = '@font-face {\n' +
                    `   font-family: '${name}';\n` +
                    `   src: url('${fileUri}.eot');\n` +
                    `   src: local('${name}'), url('${fileUri}.woff') format('woff'), url('${fileUri}.ttf') format('truetype'), url('${fileUri}.svg') format('svg');\n` +
                    '   font-weight: normal;\n' +
                    '   font-style: normal;\n' +
                    '}';
                document.body.appendChild(style);
                const div = document.createElement('div');
                div.style.fontFamily = name;
                div.style.height = "0";
                div.innerHTML = '&nbsp;';
                document.body.appendChild(div);
            }
        }
    }
}