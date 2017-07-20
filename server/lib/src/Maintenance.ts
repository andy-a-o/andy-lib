import {Listeners} from "@andy-lib/util";

export interface MaintenanceConfig {
    ignore?: boolean | undefined;
}

export interface MaintenanceListener {
    onMaintenanceStarted();
}

export class Maintenance {

    protected constructor() {
    }

    static addMaintenanceListener(l: MaintenanceListener) {
        Maintenance.listeners.add(l);
    }

    static removeMaintenanceListener(l: MaintenanceListener) {
        Maintenance.listeners.remove(l);
    }

    static init(config: MaintenanceConfig) {
        Maintenance.ignored = config.ignore;
    }

    /**
     * @return Whether the maintenance state can be ignored (by admin users mostly).
     */
    static isIgnored(): boolean {
        return Maintenance.ignored;
    }

    static start(from: Date, to: Date) {
        if (this.isStarted()) {
            return;
        }
        console.info(`Maintenance scheduled from ${from} to ${to}`);
        Maintenance.startTime = from;
        Maintenance.endTime = to;
        Maintenance.listeners.call("onMaintenanceStarted");
    }

    static isStarted() {
        return !!Maintenance.startTime && Maintenance.endTime && Maintenance.endTime.getTime() > Date.now();
    }

    static getStartTime(): Date | undefined {
        return Maintenance.startTime;
    }

    static getEndTime(): Date | undefined {
        return Maintenance.endTime;
    }

    private static startTime?: Date | undefined;
    private static endTime?: Date | undefined;
    private static ignored: boolean = false;

    static readonly listeners = new Listeners<MaintenanceListener>([
        "onMaintenanceStarted"
    ]);
}