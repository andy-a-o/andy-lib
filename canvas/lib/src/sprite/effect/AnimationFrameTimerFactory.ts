import {TimerFactory} from "./TimerFactory";
import {AnimationFrameTimer} from "./AnimationFrameTimer";
import {AbstractTimer} from "@andy-lib/util";

export class AnimationFrameTimerFactory extends TimerFactory {

    newTimer(): AbstractTimer {
        return new AnimationFrameTimer();
    }
}