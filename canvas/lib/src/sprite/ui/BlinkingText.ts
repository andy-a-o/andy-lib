import {EffectSequence, FadeIn, FadeOut, HasOpacity, None} from "@andy-lib/effect";
import {AnimationFrameTimer} from "../effect/AnimationFrameTimer";
import {Text, TextConfig} from "../Text";
import {Stage, StageListener} from "../Stage";

export interface BlinkingTextConfig extends TextConfig {
    time?: number | undefined;
}

export class BlinkingText extends Text implements HasOpacity, StageListener {
    private readonly blink: EffectSequence;

    constructor(res: BlinkingTextConfig) {
        super(res);
        const easing = new None();
        const fadeOutTimer = new AnimationFrameTimer();
        const fadeInTimer = new AnimationFrameTimer();
        const time = res.time || 1000;
        this.blink = new EffectSequence();
        this.blink.add(new FadeOut(this, time, fadeOutTimer, easing, "easeNone"));
        this.blink.add(new FadeIn(this, time, fadeInTimer, easing, "easeNone"));
        this.blink.setLooping(true);
    }

    onAdded(stage: Stage) {
        super.onAdded(stage);
        this.resumeBlinking();
    }

    onRemoved(stage: Stage) {
        super.onRemoved(stage);
        this.blink.stop();
    }

    onStageStarted(stage: Stage) {
        super.onStageStarted(stage);
        this.resumeBlinking();
    }

    onStageStopped(stage: Stage) {
        super.onStageStopped(stage);
        this.blink.stop();
    }

    setVisible(visible: boolean) {
        super.setVisible(visible);
        if (visible) {
            this.blink.play();
        } else if (this.blink.isPlaying()) {
            this.blink.stop();
        }
    }

    private resumeBlinking() {
        if (this.isVisible()) {
            this.blink.play();
        }
    }
}