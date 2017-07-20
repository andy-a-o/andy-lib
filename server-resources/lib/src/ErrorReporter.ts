// import {KeyRegistry} from "../sprite/KeyRegistry";
// import {FormSubmitter} from "../../common/util/FormSubmitter";
// import {Profiler} from "../../common/profiler/Profiler";
// import {Parser} from "../../common/url/Parser";
// import {Icon} from "../sprite/Icon";
// import {Group} from "../sprite/Group";
import {RequestFactory} from "@andy-lib/server";
import {Profiler} from "@andy-lib/profiler";
// import {UrlParser} from "@andy-lib/util"

// import {Scene} from "../scene/Scene";
// import {Stage} from "../sprite/Stage";
// import {DisplayObject} from "../sprite/DisplayObject";

export interface ErrorReportDialogButtonConfig {
    url?: string | undefined;
    label?: string | undefined;
}

// export interface ErrorReportDialogConfig {
//     id?: string | undefined;
//     width?: number | undefined;
//     height?: number | undefined;
//     submit?: ErrorReportDialogButtonConfig | undefined;
//     cancel?: ErrorReportDialogButtonConfig | undefined;
// }

export interface ErrorReporterConfig {
    url: string;
    level?: "warn" | "error" | undefined;
    unique?: boolean | undefined;
    // dialog?: ErrorReportDialogConfig | undefined;
}

export class ErrorReporter {

    protected constructor() {
    }

    static init(config: ErrorReporterConfig) {
        config = {
            level: "error",
            unique: true
            , ...config
        };
        url = config.url;
        unique = config.unique;
        // if (config.dialog) {
        //     initDialog(config.dialog);
        // }
        window.onerror = ErrorReporter.error;
        errorLevel = ErrorLevels[config.level] || ErrorLevels.error;
    }

    static warn(message: string, source?: string, lineno?: number) {
        report(message, source, lineno, ErrorLevels.warn);
    }

    static error(message: string, source?: string, lineno?: number) {
        report(message, source, lineno, ErrorLevels.error);
    }

    // static showReportDialog(scene: Scene<any, any>, callback: () => void) {
    //     const s = scene.getStage();
    //     currentScene = scene;
    //     console.log(sceneDump = JSON.stringify(currentScene));
    //     console.log(stageDump = JSON.stringify(s));
    //     screenshot = createSnapshot(s);
    //     if ($dialog) {
    //         const keyRegistry = s.getKeyRegistry();
    //         keyRegistry.unbindKeys();
    //         KeyRegistry.getGlobalRegistry().unbindKeys();
    //         const canvas = $dialog.find("canvas")[0] as HTMLCanvasElement;
    //         const stageCanvas = s.getCanvas();
    //         const ctx = canvas.getContext("2d");
    //         const sw = canvas.width / stageCanvas.width;
    //         const sh = canvas.height / stageCanvas.height;
    //         const scale = Math.min(sw, sh);
    //         ctx.save();
    //         ctx.clearRect(0, 0, canvas.width, canvas.height);
    //         ctx.scale(scale, scale);
    //         ctx.drawImage(stageCanvas, 0, 0);
    //         ctx.restore();
    //         $dialog.find("textarea").val("");
    //         $dialog.one("dialogclose", function () {
    //             keyRegistry.bindKeys();
    //             KeyRegistry.getGlobalRegistry().bindKeys();
    //             callback && callback();
    //             currentScene = undefined;
    //             stageDump = undefined;
    //             sceneDump = undefined;
    //             screenshot = undefined;
    //         });
    //         $dialog.dialog("open")
    //     }
    // }

}

let url: string;
let unique: boolean = false;
let errors: { [key: string]: boolean } = {};
// let $dialog: JQuery;
// let currentScene: Scene<any, any>;
let screenshot: HTMLCanvasElement;
let stageDump: string;
let sceneDump: string;

interface ErrorLevel {
    level: number;
    console: "warn" | "error";
}

abstract class ErrorLevels {
    static readonly warn: ErrorLevel = {level: 1, console: "warn"};
    static readonly error: ErrorLevel = {level: 2, console: "error"};
}

let errorLevel: ErrorLevel = ErrorLevels.error;

function report(message: string, source: string, lineno: number, level: ErrorLevel) {
    const key = source + ":" + lineno;
    if (!errors[key] || !unique) {
        errors[key] = true;
        if ((message.indexOf("Script error") >= 0) && !lineno) {
            // External (like VK"s) script error,
            // see http://stackoverflow.com/questions/5913978/cryptic-script-error-reported-in-javascript-in-chrome-and-firefox
            return;
        }
        Profiler.error(message);
        console[level.console](message + ", " + source + ":" + lineno);
        if (url && (level.level >= errorLevel.level)) {
            const request = RequestFactory.newRequest("POST", url);
            request.setData({
                error: message,
                source: source,
                lineNumber: lineno,
                time: Date.now()
            });
            request.send();
        }
    }
}

// function initDialog(dialog: ErrorReportDialogConfig) {
//     $(document).ready(function () {
//         const id = dialog.id || "errorReportDialog";
//         $dialog = $(`#${id}`);
//         const submit = dialog.submit || {};
//         const cancel = dialog.cancel || {};
//         const submitUrl = submit.url;
//         const submitButtonLabel = submit.label || "Submit";
//         const cancelButtonLabel = cancel.label || "Cancel";
//         const buttons = {};
//         buttons[submitButtonLabel] = function () {
//             if (submitUrl) {
//                 const userComment = $dialog.find("textarea").val();
//                 const formSubmitter = new FormSubmitter(submitUrl);
//                 if (FormSubmitter.isImageSubmitSupported()) {
//                     formSubmitter.addImageAsCanvas("screenshot", screenshot);
//                 }
//                 formSubmitter.add("comment", userComment);
//                 formSubmitter.add("sceneDump", sceneDump);
//                 formSubmitter.add("stageDump", stageDump);
//                 formSubmitter.add("screenWidth", screen.width);
//                 formSubmitter.add("screenHeight", screen.height);
//                 formSubmitter.submit();
//                 Profiler.error("Report: " + userComment);
//             }
//             $dialog.dialog("close");
//         };
//         buttons[cancelButtonLabel] = function () {
//             $dialog.dialog("close");
//         };
//         $dialog.dialog({
//             autoOpen: false,
//             height: dialog.width || 600,
//             width: dialog.height || 600,
//             modal: true,
//             buttons: buttons
//         });
//     });
// }

/**
 * Clear all icons with external URL because
 * otherwise we cannot access canvas model due to
 * security reasons.
 */
// function createSnapshot(stage: Stage): HTMLCanvasElement {
//     const hiddenIcons = [];
//     const topLevelSprites = stage.getTopLevelSprites();
//     for (let i = 0, n = topLevelSprites.length; i < n; ++i) {
//         hideIcons(topLevelSprites[i], hiddenIcons);
//     }
//     const canvas = stage.getCanvas();
//     const tainted = hiddenIcons.length || checkIfCanvasTainted(canvas);
//     const snapshot = tainted
//         ? stage.createSnapshot()
//         : canvas;
//     unhideIcons(hiddenIcons);
//     return snapshot;
// }
//
// function checkIfCanvasTainted(canvas: HTMLCanvasElement): boolean {
//     try {
//         canvas.getContext("2d").getImageData(0, 0, 1, 1);
//         return false;
//     } catch (e) {
//         return true;
//     }
// }
//
// function hideIcons(sprite: DisplayObject, hiddenIcons: Icon[]) {
//     if (!sprite.isVisible()) {
//         return;
//     }
//     if (sprite instanceof Icon) {
//         const imageUrl = sprite.getImageUrl();
//         if (imageUrl) {
//             const baseHostname = getBaseHostname();
//             const hostname = Parser.parse(imageUrl).host;
//             if (hostname.indexOf(baseHostname) < 0) {
//                 sprite.hide();
//                 hiddenIcons.push(sprite);
//             }
//         }
//     } else if (sprite instanceof Group) {
//         sprite.resetCanvas();
//         sprite.setDirty(true);
//     }
//     const children = sprite.getChildren();
//     for (let i = 0, n = children.length; i < n; ++i) {
//         hideIcons(children[i], hiddenIcons);
//     }
// }
//
// function unhideIcons(icons: Icon[]) {
//     for (let i = 0, n = icons.length; i < n; ++i) {
//         icons[i].show();
//     }
// }

// let baseHostname: string;
//
// function getBaseHostname() {
//     if (!baseHostname) {
//         const host = UrlParser.parse(window.location.href).host;
//         let zones = host.split(".");
//         if (zones.length > 2) {
//             zones = zones.slice(-2);
//         }
//         baseHostname = zones.join(".");
//         console.debug("Base hostname: " + baseHostname);
//     }
//     return baseHostname;
// }