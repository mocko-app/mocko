const semver = require('semver');
if(!semver.satisfies(process.version, '>=14')) {
    console.error(`Your NodeJS version (${process.version}) is too old for mocko :(\nUse at least NodeJS 14 https://docs.mocko.dev/updating-node/`);
    process.exit(1);
}

const Bossy = require('@hapi/bossy');
const Joi = require('joi');
const updateNotifier = require('update-notifier');

const pkg = require('../package.json');
const { definition } = require('./definition');
const { watch } = require('./watcher');

const debug = require('debug')('mocko:cli:main');

const usage = Bossy.usage(definition, 'mocko [options] <path to mocks folder>\nExample: mocko -p 4000 mocks');

function run() {
    debug('running update-notifier');
    updateNotifier({pkg}).notify();

    debug('building args with bossy');
    const args = buildArgs();

    if(args.version) {
        console.log(`mocko-cli/${pkg.version} NodeJS/${process.version} v8/${process.versions.v8} openssl/${process.versions.openssl}`);
        process.exit(0);
    }
    
    if(args.help || !args._ || args._.length !== 1) {
        console.log(usage);
        process.exit(0);
    }

    debug('validating args with joi');
    validateArgs(args);
    
    const path = args._[0];
    const { port, url, timeout } = args;

    process.env['SERVER_PORT'] = port;
    process.env['PROXY_BASE-URI'] = url;
    process.env['PROXY_TIMEOUT-MILLIS'] = timeout;
    process.env['MOCKS_FOLDER'] = path;

    debug('starting mocko-proxy');
    const { server } = require('@mocko/proxy');
    
    if(args.watch) {
        debug('starting watcher with chokidar');
        watch(path, () => server.then(s => s.remapRoutes()));
    }

    debug('done');
}

function buildArgs() {
    const args = Bossy.parse(definition);

    if (args instanceof Error) {
        console.error(args.message);
        console.log(usage);

        process.exit(1);
    }

    return args;
}

function validateArgs({ url }) {
    const validation = Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .label('url')
    .validate(url);

    if(url && validation.error) {
        console.error(validation.error.message);
        process.exit(1);
    }
}

module.exports.run = run;
