import resolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";

import {nameLibrary, PATH_SRC, PATH_DIST} from "./config-library.js";

export default {
    entry: PATH_SRC + nameLibrary + ".ts",
    format: "umd",
    moduleName: nameLibrary,
    sourceMap: true,
    dest: PATH_DIST + nameLibrary + ".umd.js",
    plugins: [
        typescript(),
        resolve({
            module: true,
            main: true
        })
    ]
};