import {FixedIntervalTimer} from "./FixedIntervalTimer";

const MAX_TIMEOUT = 0x7FFFFFFF;

export class Timer extends FixedIntervalTimer {

    /**
     * @param interval Timer interval, in milliseconds (default is 1000).
     */
    constructor(interval?: number) {
        super(interval);
    }

    protected setTimeout(handler: () => void, timeout: number): any {
        if (timeout > MAX_TIMEOUT) {
            timeout = MAX_TIMEOUT;
        }
        return window.setTimeout(handler, timeout);
    }

    protected clearTimeout(timerId: any) {
        window.clearTimeout(timerId);
    }
}