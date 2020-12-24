module.exports.definition = {
    h: {
        description: 'Shows this screen',
        alias: 'help',
        type: 'help',
    },
    v: {
        description: 'Shows the current version',
        alias: 'version',
        type: 'help',
    },
    w: {
        description: 'Watches for file changes and restarts the server',
        alias: 'watch',
        type: 'boolean',
        default: false,
    },
    p: {
        description: 'Port to serve the mocks',
        alias: 'port',
        type: 'number',
        default: 8080,
    },
    u: {
        description: 'URL to proxy requests when no mock is defined',
        alias: 'url',
        default: '',
    },
    t: {
        description: 'Max time to wait for a response from the proxied URL in millis',
        alias: 'timeout',
        type: 'number',
        default: 30000,
    },
};