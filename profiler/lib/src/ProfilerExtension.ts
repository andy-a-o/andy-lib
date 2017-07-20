import {ProfilerContext} from "./ProfilerContext";

export class ProfilerExtension {

    constructor(private name: string) {
    }

    init(context: ProfilerContext) {
        // Stub
    }

    reset(context: ProfilerContext) {
        // Stub
    }

    getName(): string {
        return this.name;
    }

    startSection(profilerName: string, context: ProfilerContext) {
        // Stub
    }

    endSection(profilerName: string, context: ProfilerContext) {
        // Stub
    }

    begin(profilerName: string, context: ProfilerContext) {
        // Stub
    }

    end(profilerName: string, context: ProfilerContext) {
        // Stub
    }

    event(eventName: string, context: ProfilerContext) {
        // Stub
    }

    error(message: string, context: ProfilerContext) {
        // Stub
    }

    serialize(context: ProfilerContext): string | null {
        return "";
    }
}