const chokidar = require('chokidar');

const WATCHER_READY_MARKER = 'Watching mocks folder for changes';

function watch(dir, onChange) {
    const watcher = chokidar.watch(dir, {
        ignoreInitial: true,
        ignorePermissionErrors: true,
    });

    watcher.on('change', onChange)
            .on('add', onChange)
            .on('unlink', onChange)
            .on('ready', () => {
                if (process.env.MOCKO_LOG_WATCHER_READY) {
                    console.log(WATCHER_READY_MARKER);
                }
            });
}

module.exports.watch = watch;
