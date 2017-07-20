import {ClientJob} from "./ClientJob";
import {Maintenance} from "./Maintenance";

export interface MaintenanceJobConfig {
    startAfter: number;
    endAfter: number;
}

export class MaintenanceJob extends ClientJob {
    private start: Date;
    private end: Date;

    constructor(id: string, name: string, config: MaintenanceJobConfig) {
        super(id, name);
        const now = Date.now();
        this.start = new Date(now + config.startAfter * 1000);
        this.end = new Date(now + config.endAfter * 1000);
    }

    execute() {
        if (!Maintenance.isStarted()) {
            Maintenance.start(this.start, this.end);
        }
    }
}