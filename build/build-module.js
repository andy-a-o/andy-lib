var rollup = require("rollup");
var resolve = require("rollup-plugin-node-resolve");
var typescript = require("rollup-plugin-typescript2");

var nameLibrary = process.argv[2];
var format = process.argv[3];
var destFile = nameLibrary + "." + format + ".js";

console.log("Building library " + destFile);

rollup.rollup({
    entry: "lib/" + nameLibrary + ".ts",
    plugins: [
        typescript(),
        resolve({
            module: true,
            main: true
        })
    ]
}).then(function (bundle) {
    bundle.write({
        moduleName: nameLibrary,
        format: format,
        dest: "dist/" + destFile
    });
}).catch(console.error);