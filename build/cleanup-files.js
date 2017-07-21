const del = require('del');
del(['dist/src/**/*.js', 'dist/src/**/*.js.map', 'dist/!(*.umd.js|*.es.js|*.d.ts|*.umd.js.map|*.es.js.map|src)']).then(paths => {
    console.log('Files and folders that would be deleted:\n', paths.join('\n'));
});