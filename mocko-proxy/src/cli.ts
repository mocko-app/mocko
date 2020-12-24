#!/usr/bin/env node
const Bossy = require('@hapi/bossy');
const Joi = require('joi');

const definition = {
    h: {
        description: 'Show help',
        alias: 'help',
        type: 'help',
    },
    u: {
        description: 'URL to proxy requests when no mock is defined',
        alias: 'url',
        default: '',
    },
    t: {
        description: 'Max time to wait for a response from the proxies URL in millis',
        alias: 'timeout',
        type: 'number',
        default: 30000,
    },
};

const args = Bossy.parse(definition);
const usage = Bossy.usage(definition, 'mocko [options] <path to mocks folder>');

if (args instanceof Error) {
    console.error(args.message);
    console.log(usage);

    process.exit(1);
}

if(args.h || !args._ || args._.length !== 1) {
    console.log(usage);
    process.exit(0);
}

const path = args._[0];
const { url, timeout } = args;

const validation = Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .label('url')
    .validate(url);

if(url && validation.error) {
    console.error(validation.error.message);
    process.exit(1);
}

process.env['PROXY_BASE-URI'] = url;
process.env['PROXY_TIMEOUT-MILLIS'] = timeout;
process.env['MOCKS_FOLDER'] = path;
require('./main');
