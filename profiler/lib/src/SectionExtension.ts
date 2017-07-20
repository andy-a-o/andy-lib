import {ProfilerExtension} from "./ProfilerExtension";
import {ProfilerContext} from "./ProfilerContext";

export interface SectionExtensionOptions {
    names: string[];
}

export class SectionExtension extends ProfilerExtension {
    private readonly sectionNames: string[];
    private readonly sections: { [key: string]: number[] } = {};

    constructor(options: SectionExtensionOptions) {
        super("sections");
        this.sections = {};
        const sectionNames = options.names;
        const sectionCount = sectionNames.length;
        for (let i = 0; i < sectionCount; ++i) {
            const sectionName = sectionNames[i];
            this.sections[sectionName] = new Array<number>(2);
        }
        this.sectionNames = sectionNames;
    }

    reset() {
        const sectionNames = this.sectionNames;
        for (let i = 0, n = sectionNames.length; i < n; ++i) {
            const sectionName = sectionNames[i];
            const section = this.sections[sectionName];
            delete section[0];
            delete section[1];
        }
    }

    startSection(name: string, context: ProfilerContext) {
        this.sections[name][0] = context.getCurrentFrame();
    }

    endSection(name: string, context: ProfilerContext) {
        this.sections[name][1] = context.getCurrentFrame();
    }

    serialize(context: ProfilerContext): string {
        const sections = this.sections;
        const sectionNames = this.sectionNames;
        const sectionCount = sectionNames.length;
        const data = new Array(sectionCount);
        let sectionIndex = 0;
        for (let i = 0; i < sectionCount; ++i) {
            const sectionName = sectionNames[i];
            const times = sections[sectionName];
            if (times[0]) {
                data.push(sectionName, times[0], times[1]);
                ++sectionIndex;
            }
        }
        return data.slice(0, sectionIndex).join("|");
    }
}