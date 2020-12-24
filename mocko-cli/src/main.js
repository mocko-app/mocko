const Bossy = require('@hapi/bossy');
const Joi = require('joi');
const semver = require('semver');
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');

const { definition } = require('./definition');

const usage = Bossy.usage(definition, 'mocko [options] <path to mocks folder>\nExample: mocko -p 4000 mocks');

function run() {
    updateNotifier({pkg}).notify();
    validateNodeVersion();
    const args = buildArgs();

    if(args.version) {
        console.log(`mocko-cli/${pkg.version} NodeJS/${process.version} v8/${process.versions.v8} openssl/${process.versions.openssl}`);
        process.exit(0);
    }
    
    if(args.help || !args._ || args._.length !== 1) {
        console.log(usage);
        process.exit(0);
    }

    validateArgs(args);
    
    const path = args._[0];
    const { port, url, timeout } = args;

    process.env['SERVER_PORT'] = port;
    process.env['PROXY_BASE-URI'] = url;
    process.env['PROXY_TIMEOUT-MILLIS'] = timeout;
    process.env['MOCKS_FOLDER'] = path;
    require('@mocko/proxy');
}

function validateNodeVersion() {
    if(!semver.satisfies(process.version, '>=12')) {
        console.error(`Your NodeJS version (${process.version}) is too old for mocko :(\nUse at least NodeJS 12`);
        process.exit(1);
    }
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
