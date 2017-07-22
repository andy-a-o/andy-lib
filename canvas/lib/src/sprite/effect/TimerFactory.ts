import {AbstractTimer, Timer} from "@andy-lib/util";

export class TimerFactory {

    newTimer(interval?: number): AbstractTimer {
        return new Timer(interval);
    }
}