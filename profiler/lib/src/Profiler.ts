import {ProfilerExtension} from "./ProfilerExtension";
import {ProfilerContext} from "./ProfilerContext";
import {TimeExtension} from "./TimeExtension";
import {FrameExtension} from "./FrameExtension";
import {MemoryExtension} from "./MemoryExtension";
import {NamedProfilerExtension, NamedProfilerExtensionOptions} from "./NamedProfilerExtension";
import {EventExtension, EventExtensionOptions} from "./EventExtension";
import {ErrorExtension, ErrorExtensionOptions} from "./ErrorExtension";
import {SectionExtension, SectionExtensionOptions} from "./SectionExtension";
import {NavigatorExtension} from "./NavigatorExtension";
import {ScreenExtension} from "./ScreenExtension";
import {HttpExtension, HttpExtensionOptions} from "./HttpExtension";
import {AbstractPropertyExtensionOptions} from "./AbstractPropertyExtension";

export interface ProfilerConfig {
    chunkSize: number;
    flushUrl: string;
    extensions?: { [name: string]: any } | undefined;
}

export class Profiler {

    protected constructor() {
    }

    static init(options: ProfilerConfig) {
        const extensions = options.extensions || {};
        const extensionArray: ProfilerExtension[] = [];
        for (let name in extensions) {
            if (extensions.hasOwnProperty(name)) {
                const extensionOpts = extensions[name];
                switch (name) {
                    case "time":
                        extensionArray.push(new TimeExtension());
                        break;
                    case "frames":
                        extensionArray.push(new FrameExtension());
                        break;
                    case "memory":
                        extensionArray.push(new MemoryExtension());
                        break;
                    case "profilers":
                        extensionArray.push(Profiler.namedProfilerExtension = new NamedProfilerExtension(<NamedProfilerExtensionOptions>extensionOpts));
                        break;
                    case "events":
                        extensionArray.push(Profiler.eventExtension = new EventExtension(<EventExtensionOptions>extensionOpts));
                        break;
                    case "errors":
                        extensionArray.push(Profiler.errorExtension = new ErrorExtension(<ErrorExtensionOptions>extensionOpts));
                        break;
                    case "sections":
                        extensionArray.push(Profiler.sectionExtension = new SectionExtension(<SectionExtensionOptions>extensionOpts));
                        break;
                    case "navigator":
                        extensionArray.push(new NavigatorExtension(<AbstractPropertyExtensionOptions>extensionOpts));
                        break;
                    case "screen":
                        extensionArray.push(new ScreenExtension(<AbstractPropertyExtensionOptions>extensionOpts));
                        break;
                    case "http":
                        extensionArray.push(new HttpExtension(<HttpExtensionOptions>extensionOpts));
                        break;
                }
            }
        }
        Profiler.context = new ProfilerContext(options, extensionArray);
        Profiler.context.init();
    }

    static startSection(name: string) {
        Profiler.sectionExtension.startSection(name, Profiler.context);
    }

    static endSection(name: string) {
        Profiler.sectionExtension.endSection(name, Profiler.context);
    }

    static startFrame() {
        Profiler.context.startFrame();
    }

    static endFrame() {
        Profiler.context.endFrame();
    }

    static begin(name: string) {
        if (!name) {
            throw new Error("Name param not specified!");
        }
        Profiler.namedProfilerExtension.begin(name, Profiler.context);
    }

    static end(name: string) {
        Profiler.namedProfilerExtension.end(name, Profiler.context);
    }

    static event(text: string) {
        Profiler.eventExtension.event(Profiler.lastEvent = text, Profiler.context);
    }

    static error(message: string) {
        Profiler.errorExtension.error(Profiler.lastError = message, Profiler.context);
    }

    static getLastEvent(): string {
        return Profiler.lastEvent;
    }

    static getLastError(): string {
        return Profiler.lastError;
    }

    private static context: ProfilerContext = new ProfilerContext({chunkSize: 0, flushUrl: ""}, []);
    private static sectionExtension: ProfilerExtension = new ProfilerExtension("section");
    private static namedProfilerExtension: ProfilerExtension = new ProfilerExtension("named");
    private static eventExtension: ProfilerExtension = new ProfilerExtension("event");
    private static errorExtension: ProfilerExtension = new ProfilerExtension("error");
    private static lastEvent: string;
    private static lastError: string;
}