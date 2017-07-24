var fs = require("fs");
var rollup = require("rollup");
var resolve = require("rollup-plugin-node-resolve");
var typescript = require("rollup-plugin-typescript2");

var nameLibrary = process.argv[2];
var format = process.argv[3];
var destFile = nameLibrary + "." + format + ".js";

console.log("Building library " + destFile);

var pkg = JSON.parse(fs.readFileSync("package.json"));
var externals = Object.keys(pkg.dependencies || {});

rollup.rollup({
    entry: "lib/" + nameLibrary + ".ts",
    plugins: [
        typescript(),
        resolve({
            module: true,
            main: true
        })
    ],
    external: externals
}).then(function (bundle) {
    bundle.write({
        moduleName: nameLibrary,
        format: format,
        dest: "dist/" + destFile
    });
}).catch(console.error);