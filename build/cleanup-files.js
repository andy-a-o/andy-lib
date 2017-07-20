const del = require('del');
del(['dist/src/!(*.d.ts)', 'dist/!(*.umd.js|*.esm.js|*.d.ts|*.umd.js.map|*.esm.js.map|src)']).then(paths => {
    console.log('Files and folders that would be deleted:\n', paths.join('\n'));
});