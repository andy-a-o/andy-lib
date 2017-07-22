import {SpriteSheet, SpriteSheetConfig} from "./SpriteSheet";
import {Listeners} from "@andy-lib/util";
import {Rect} from "../util/Rect";

export interface AnimationListener {
    onAnimationStarted?(sheet: AnimatedSpriteSheet);

    onAnimationFinished?(sheet: AnimatedSpriteSheet);

    onAnimationPaused?(sheet: AnimatedSpriteSheet);

    onAnimationResumed?(sheet: AnimatedSpriteSheet);

    onAnimationStopped?(sheet: AnimatedSpriteSheet);
}

export interface PlaybackConfig {
    reverse?: boolean | undefined;
    looping?: boolean | undefined;
}

export interface FramesConfig {
    start?: number | undefined;
    end?: number | undefined;
    offset?: number | undefined;
}

export interface AnimationConfig extends FramesConfig, PlaybackConfig {
}

export interface AnimatedSpriteSheetConfig extends SpriteSheetConfig, PlaybackConfig {
    fps?: number | undefined;
    frames?: FramesConfig | undefined;
}

/**
 * A sprite sheet with animate() function.
 */
export class AnimatedSpriteSheet extends SpriteSheet {
    private readonly animationListeners = new Listeners<AnimationListener>([
        "onAnimationStarted",
        "onAnimationFinished",
        "onAnimationPaused",
        "onAnimationResumed",
        "onAnimationStopped"
    ]);

    private readonly initialStart?: number | undefined;
    private readonly initialEnd?: number | undefined;
    private readonly initialOffset?: number | undefined;
    private readonly initialReverse?: boolean | undefined;
    private readonly initialLooping?: boolean | undefined;

    private fps: number;
    protected moving: boolean = false;

    private looping?: boolean | undefined;
    private reverse?: boolean | undefined;
    private finalizing?: boolean | undefined;
    private offset?: number | undefined;
    private begin?: number | undefined;
    private startFrame?: number | undefined;
    private endFrame?: number | undefined;
    private paused?: boolean | undefined;

    constructor(res: AnimatedSpriteSheetConfig) {
        super(res);
        const frames = res.frames;
        frames && (this.initialStart = frames.start);
        frames && (this.initialEnd = frames.end);
        frames && (this.initialOffset = frames.offset);
        res.reverse && (this.initialReverse = true);
        res.looping && (this.initialLooping = true);
        this.fps = res.fps || 30;
        this.moving = false;
    }

    setFps(fps: number) {
        this.fps = fps;
    }

    addAnimationListener(l: AnimationListener) {
        this.animationListeners.add(l);
    }

    removeAnimationListener(l: AnimationListener) {
        this.animationListeners.remove(l);
    }

    update(rect: Rect) {
        if (this.finalizing) {
            this.moving = false;
            this.finalizing = false;
            this.fireAnimationFinished();
            this.onAnimationFinished();
        }
        if (this.moving) {
            const framesPassed = Math.floor(((Date.now() - this.begin) / 1000) * this.fps);
            let frame = this.reverse ? this.offset - framesPassed : this.offset + framesPassed;
            if (this.reverse) {
                if (frame < this.endFrame) {
                    frame = this.endFrame;
                }
            } else {
                if (frame > this.endFrame) {
                    frame = this.endFrame;
                }
            }
            this.setFrame(frame);
            if (frame == this.endFrame) {
                if (this.looping) {
                    this.offset = this.startFrame;
                    this.begin = Date.now();
                    this.setFrame(this.startFrame);
                } else {
                    this.finalizing = true;
                }
            }
        }
        super.update(rect);
    }

    seek(frame: number) {
        this.offset = frame;
        if (this.moving) {
            this.begin = Date.now();
        }
    }

    /**
     * Runs animation for this sprite.
     */
    animate(cfg: AnimationConfig = {}) {
        this.reverse = (cfg.reverse !== undefined) ? cfg.reverse : this.initialReverse;
        this.looping = (cfg.looping !== undefined) ? cfg.looping : this.initialLooping;
        this.startFrame = (cfg.start !== undefined) ? cfg.start : this.getDefaultStartFrame();
        this.endFrame = (cfg.end !== undefined) ? cfg.end : this.getDefaultEndFrame();
        this.offset = (cfg.offset !== undefined) ? cfg.offset : this.getDefaultOffset(this.startFrame);
        this.begin = Date.now();
        this.moving = true;
        this.finalizing = false;
        this.setFrame(this.startFrame);
        this.fireAnimationStarted();
    }

    isMoving(): boolean {
        return this.moving;
    }

    pause() {
        if (!this.moving) {
            return;
        }
        this.offset = this.getFrame();
        this.moving = false;
        this.paused = true;
        this.fireAnimationPaused();
    }

    resume() {
        if (!this.paused) {
            return;
        }
        this.moving = true;
        this.paused = false;
        this.begin = Date.now();
        this.fireAnimationResumed();
    }

    stop() {
        if (!this.moving) {
            return;
        }
        this.moving = false;
        this.finalizing = false;
        this.paused = false;
        delete this.begin;
        this.fireAnimationStopped();
    }

    isPaused(): boolean {
        return this.paused;
    }

    setLooping(looping: boolean) {
        this.looping = looping;
    }

    isLooping(): boolean {
        return this.looping;
    }

    protected onAnimationFinished() {
        // Stub
    }

    private getDefaultStartFrame(): number {
        if (this.initialStart !== undefined) {
            return this.initialStart;
        }
        return this.reverse ? this.getFrameCount() - 1 : 0;
    }

    private getDefaultEndFrame(): number {
        if (this.initialEnd !== undefined) {
            return this.initialEnd;
        }
        return this.reverse ? 0 : this.getFrameCount() - 1;
    }

    private getDefaultOffset(startFrame: number): number {
        if (this.initialOffset !== undefined) {
            return this.initialOffset;
        }
        return startFrame;
    }

    toJSON(): any {
        return {
            ...super.toJSON(),
            fps: this.fps,
            moving: this.moving
        };
    }

    private fireAnimationStarted() {
        this.animationListeners.call("onAnimationStarted", [this]);
    }

    private fireAnimationFinished() {
        this.animationListeners.call("onAnimationFinished", [this]);
    }

    private fireAnimationPaused() {
        this.animationListeners.call("onAnimationPaused", [this]);
    }

    private fireAnimationResumed() {
        this.animationListeners.call("onAnimationResumed", [this]);
    }

    private fireAnimationStopped() {
        this.animationListeners.call("onAnimationStopped", [this]);
    }
}