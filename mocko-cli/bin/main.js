#!/usr/bin/env node
const Bossy = require('@hapi/bossy');
const Joi = require('joi');
const semver = require('semver');
const { version } = require('../package.json');

if(!semver.satisfies(process.version, '>=12')) {
    console.error(`Your NodeJS version (${process.version}) is too old for mocko :(\nUse at least NodeJS 12`);
    process.exit(1);
}

const definition = {
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

const args = Bossy.parse(definition);
const usage = Bossy.usage(definition, 'mocko [options] <path to mocks folder>\nExample: mocko -p 4000 mocks');

if (args instanceof Error) {
    console.error(args.message);
    console.log(usage);

    process.exit(1);
}

if(args.version) {
    console.log(`mocko-cli/${version} NodeJS/${process.version} v8/${process.versions.v8} openssl/${process.versions.openssl}`);
    process.exit(0);
}

if(args.help || !args._ || args._.length !== 1) {
    console.log(usage);
    process.exit(0);
}

const path = args._[0];
const { port, url, timeout } = args;

const validation = Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .label('url')
    .validate(url);

if(url && validation.error) {
    console.error(validation.error.message);
    process.exit(1);
}

process.env['SERVER_PORT'] = port;
process.env['PROXY_BASE-URI'] = url;
process.env['PROXY_TIMEOUT-MILLIS'] = timeout;
process.env['MOCKS_FOLDER'] = path;
require('@mocko/proxy');
