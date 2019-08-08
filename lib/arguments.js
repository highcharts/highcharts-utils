const { existsSync, readFileSync } = require('fs');
const { join, resolve } = require('path');
const yargs = require('yargs');
const defaults = require('../config.json');

// Describe CLI arguments
const help = {
    apiPort: 'The port number for the API server',
    codePort: 'The port number for the code server',
    codeWatch: 'Whether to watch changes in the code and automatically reload the page',
    crtFile: 'Set the path to the crt certificate file. Provide for SSL. If a relative path is provided then it will be relative to the current working directory',
    emulateKarma: 'Run the tests in a Karma-like environment',
    highchartsDir: 'Set the path to the highcharts repository directory. If a relative path is provided then it will be relative to the current working directory',
    pemFile: 'Set the path to the pem certificate file. Provide for SSL. If a relative path is provided then it will be relative to the current working directory',
    proxy: 'Whether to set up proxies for the servers',
    topdomain: 'The domain name for the proxies. E.g code.highcharts.<topdomain>',
    useSourceCode: 'Whether to use .src.js code files. If testing compiled files, run `gulp compile` first.',
    utilsPort: 'The port number for the utils server'
};

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
const { codePort, codeWatch, apiPort, emulateKarma, proxy , topdomain, useSourceCode, utilsPort } = argv;

// Handle paths
const highchartsDir = resolve(argv.highchartsDir);
const pemFile = resolve(argv.pemFile);
const crtFile = resolve(argv.crtFile);

module.exports = {
    apiDir: join(highchartsDir, 'build/api'),
    apiPort,
    codePort,
    codeWatch,
    crtFile,
    emulateKarma,
    highchartsDir,
    pemFile,
    proxy,
    samplesDir: join(highchartsDir, 'samples'),
    topdomain: topdomain,
    useSourceCode,
    utilsPort
};