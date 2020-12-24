const chokidar = require('chokidar');

function watch(dir, onChange) {
    const watcher = chokidar.watch(dir, {
        ignoreInitial: true,
        ignorePermissionErrors: true,
    });
    
    watcher.on('change', onChange)
            .on('add', onChange)
            .on('unlink', onChange);
}

module.exports.watch = watch;
