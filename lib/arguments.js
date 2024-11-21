import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import yargs from 'yargs';
import defaults from '../config.json' with { type: "json" };

const configPath = join(import.meta.dirname, '../temp/config-user.json');
if (!existsSync(configPath)) {
    writeFileSync(configPath, JSON.stringify({}));
}

import user from '../temp/config-user.json' with { type: "json" };
import help from './settings-help.js';

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
console.log(Object.keys(yargs));
const argv = yargs().options(options).env('utils').argv;

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
    return {
        ...defaults,
        ...(userJSON ? JSON.parse(userJSON) : {})
    }
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

export default {
    getSettings,
    ...exp
};