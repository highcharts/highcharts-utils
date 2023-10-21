const { existsSync, readFileSync } = require('fs');
const { join, resolve } = require('path');
const yargs = require('yargs');
const defaults = require('../config.json');
const help = require('./settings-help');

const parseEnvFile = function (path) {
    const environmentFile = existsSync(path) ? readFileSync(path, 'utf8') : '';
    environmentFile.split('\n').forEach(line => {
        line = line.trim();
        if (
            line.length && // Ignore empty lines
            !line.startsWith('#') // Ignore comments
        ) {
            const [key, value] = line.split('=');
            process.env[key] = value;
        }
    });
}

parseEnvFile(join(process.cwd(), '.env'));

// Create CLI options for yargs
const options = Object.keys(help).reduce((options, option) => {
    options[option] = {
        default: defaults[option],
        describe: help[option]
    }
    return options;
}, {});
const argv = yargs.options(options).env('utils').argv;

// Collect argument values from yargs
const {
    codePort,
    codeSecurePort,
    codeWatch,
    compileOnDemand,
    apiPort,
    emulateKarma,
    localOnly,
    proxy,
    topdomain,
    useESModules,
    useMinifiedCode,
    utilsPort
} = argv;

// Handle paths
const highchartsDir = resolve(argv.highchartsDir);
const pemFile = resolve(argv.pemFile);
const crtFile = resolve(argv.crtFile);

const exp = {
    apiDir: join(highchartsDir, 'build/api'),
    apiPort,
    codePort,
    codeSecurePort,
    codeWatch,
    compileOnDemand,
    crtFile,
    emulateKarma,
    highchartsDir,
    localOnly: !!localOnly,
    pemFile,
    proxy,
    samplesDir: join(highchartsDir, 'samples'),
    topdomain,
    useESModules,
    useMinifiedCode,
    utilsPort
};

module.exports = {
    getSettings: (req) => Object.keys(exp)
        .reduce(
            (settings, key) => {
                settings[key] = req.session[key] ?? exp[key];
                return settings;
            },
            {}
        ),
    ...exp
};