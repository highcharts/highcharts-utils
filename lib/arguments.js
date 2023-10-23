const { existsSync, readFileSync, writeFileSync } = require('fs');
const { join, resolve } = require('path');
const yargs = require('yargs');
const defaults = require('../config.json');

const configPath = join(__dirname, '../temp/config-user.json');
if (!existsSync(configPath)) {
    writeFileSync(configPath, JSON.stringify({}));
}

const user = require('../temp/config-user.json') || {};
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
        default: user[option] ?? defaults[option],
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

// Get up-to-date settings that may have been updated in runtime by
// config-user.json, from the settings page
const getSettings = () => {

    const defaultJSON = readFileSync(
        join(__dirname, '../config.json'),
        'utf-8'
    );
    const dflt = JSON.parse(defaultJSON);
    const userJSON = readFileSync(
        join(__dirname, '../temp/config-user.json'),
        'utf-8'
    );
    const user = userJSON ? JSON.parse(userJSON) : {};
    return Object.keys(dflt)
        .reduce(
            (settings, key) => {
                settings[key] = user[key] ?? dflt[key];
                return settings;
            },
            {}
        );
}

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
    getSettings,
    ...exp
};