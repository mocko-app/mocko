const Bossy = require('@hapi/bossy');
const colors = require('colors/safe');
const { lstatSync } = require('fs');
const { join } = require('path');

const { validateDefinition } = require('./definition');

const debug = require('debug')('mocko:cli:validate');

// colors' default enabled check never sees the stream, so it misses TTY
// detection, and it predates the NO_COLOR convention
if(process.env['NO_COLOR'] || !colors.supportsColor(process.stdout)) {
    colors.disable();
}

const usage = Bossy.usage(validateDefinition, 'mocko validate [options] <path to mocks folder>\nExample: mocko validate mocks');

const MATCHING_DOCS = 'https://mocko.dev/docs/creating-mocks/matching';
const FILE_MOCKS_DOCS = 'https://mocko.dev/docs/creating-mocks/file-mocks';
const TEMPLATING_DOCS = 'https://mocko.dev/docs/creating-mocks/templating';
const HOSTS_DOCS = 'https://mocko.dev/docs/creating-mocks/proxying-and-hosts';

const HINTS = {
    'hcl-parse-error': { docs: FILE_MOCKS_DOCS },
    'invalid-mock': { docs: FILE_MOCKS_DOCS },
    'invalid-host': { docs: HOSTS_DOCS },
    'template-parse-error': {
        hint: 'The mock still maps, but every request to it responds with a 500 until the template is fixed',
        docs: TEMPLATING_DOCS,
    },
    'query-in-path': {
        hint: 'Mocks match on the path only, read query params in the template instead: {{request.query.param}}',
        docs: MATCHING_DOCS,
    },
    'suspicious-path': {
        hint: "Mocko defines path parameters with '{param}', other syntaxes only match literally",
        docs: MATCHING_DOCS,
    },
    'host-not-found': { docs: HOSTS_DOCS },
    'reserved-path': {
        hint: 'Mocks on this path are never served, move it to another path',
    },
};

async function runValidate(argv) {
    const args = Bossy.parse(validateDefinition, { argv });

    if(args instanceof Error) {
        console.error(args.message);
        console.log(usage);
        process.exit(1);
    }

    if(args.help) {
        console.log(usage);
        process.exit(0);
    }

    const paths = args._ || [];
    if(paths.length !== 1) {
        console.error('Specify the mocks folder to validate, example: mocko validate mocks');
        console.log(usage);
        process.exit(1);
    }

    const path = paths[0];
    if(!isDirectory(path)) {
        fail(args.json, `'${path}' is not a directory or your user has no permission to read it`);
    }

    debug('running mocko-core validation');
    process.env['MOCKS_FOLDER'] = path;
    const { validate } = require('@mocko/core/dist/validate');
    const result = await validate({ silent: args.json });

    const errors = result.diagnostics.filter(d => d.severity === 'error');
    const warnings = result.diagnostics.filter(d => d.severity === 'warning');
    const failed = errors.length > 0 || (args.strict && warnings.length > 0);

    if(args.json) {
        console.log(JSON.stringify({
            valid: !failed,
            errors: errors.length,
            warnings: warnings.length,
            mocks: result.mockCount,
            files: result.fileCount,
            diagnostics: result.diagnostics,
        }, null, 2));
    } else {
        render(result, { mocksDir: path, errors, warnings, failed });
    }

    process.exit(failed ? 1 : 0);
}

function isDirectory(path) {
    try {
        return lstatSync(path).isDirectory();
    } catch {
        return false;
    }
}

function fail(json, message) {
    if(json) {
        console.log(JSON.stringify({
            valid: false,
            errors: 1,
            warnings: 0,
            diagnostics: [{ code: 'mocks-folder-not-found', severity: 'error', message }],
        }, null, 2));
    } else {
        console.error(colors.red(message));
    }

    process.exit(1);
}

function render(result, { mocksDir, errors, warnings, failed }) {
    const byFile = new Map();
    for(const diagnostic of result.diagnostics) {
        const file = diagnostic.file ? join(mocksDir, diagnostic.file) : mocksDir;
        const group = byFile.get(file) || [];
        group.push(diagnostic);
        byFile.set(file, group);
    }

    for(const [file, diagnostics] of byFile) {
        console.log();
        console.log(colors.underline(file));
        diagnostics.forEach(diagnostic => renderDiagnostic(diagnostic));
    }

    console.log();
    console.log(summary(result, { errors, warnings, failed }));
}

function renderDiagnostic(diagnostic) {
    const isError = diagnostic.severity === 'error';
    const label = isError ? colors.red('error') : colors.yellow('warning');
    const indent = ' '.repeat(2 + diagnostic.severity.length + 2);
    const subject = diagnostic.mock ? `mock '${diagnostic.mock}': ` : '';

    console.log(`  ${label}  ${subject}${diagnostic.message}`);

    const { hint, docs } = HINTS[diagnostic.code] || {};
    if(hint) {
        console.log(colors.gray(`${indent}${hint}`));
    }
    if(docs) {
        console.log(colors.gray(`${indent}${docs}`));
    }
}

function summary(result, { errors, warnings, failed }) {
    const counts = `${plural(errors.length, 'error')}, ${plural(warnings.length, 'warning')}`;
    const scope = `(${plural(result.mockCount, 'mock')} across ${plural(result.fileCount, 'file')})`;

    if(failed) {
        const strictNote = errors.length === 0 ? ' (failing due to --strict)' : '';
        return `${colors.red(`✖ ${counts}${strictNote}`)} ${scope}`;
    }

    if(warnings.length > 0) {
        return `${colors.yellow(`⚠ ${counts}`)} ${scope}`;
    }

    return `${colors.green('✓ No issues found')} ${scope}`;
}

function plural(count, noun) {
    return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

module.exports.runValidate = runValidate;
