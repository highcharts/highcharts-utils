import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve, relative, isAbsolute } from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as f from './functions.js';;
import defaults from '../config.json' with { type: 'json' };

// Resolve __dirname
const __dirname = f.dirname(import.meta);

const configPath = join(__dirname, '../temp/config-user.json');
if (!existsSync(configPath)) {
    writeFileSync(
        configPath,
        '{}',
        { encoding: 'utf-8', mode: 0o664 }
    );
}

const user = f.getLocalJSON(configPath) || {};
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
const argv = yargs(hideBin(process.argv)).options(options).env('utils').argv;

// Collect argument values from yargs
export const apiPort = argv.apiPort;
export const codePort = argv.codePort;
export const codeSecurePort = argv.codeSecurePort;
export const codeWatch = argv.codeWatch;
export const compileOnDemand = argv.compileOnDemand;
export const emulateKarma = argv.emulateKarma;
export const localOnly = !!argv.localOnly;
export const proxy = argv.proxy;
export const topdomain = argv.topdomain;
export const useESModules = argv.useESModules;
export const useMinifiedCode = argv.useMinifiedCode;
export const utilsPort = argv.utilsPort;

// Handle paths
export const highchartsDir = resolve(argv.highchartsDir);
export const samplesDir = join(highchartsDir, 'samples');
export const apiDir = join(highchartsDir, 'build/api');
export const pemFile = resolve(argv.pemFile);
export const crtFile = resolve(argv.crtFile);

// Get up-to-date settings that may have been updated in runtime by
// config-user.json, from the settings page
export const getSettings = () => {
    if (_cachedSettings !== null) return _cachedSettings;

    const dflt = f.getLocalJSON(join(__dirname, '../config.json'));
    const user = f.getLocalJSON(join(__dirname, '../temp/config-user.json')) || {};

    const settings = Object.keys(dflt)
        .reduce(
            (settings, key) => {
                settings[key] = user[key] ?? dflt[key];
                return settings;
            },
            {}
        );

    _cachedSettings = settings;
    return _cachedSettings;
}

// Cache for getHighchartsDir() — invalidated on worktree switch.
let _cachedHighchartsDir = null;
let _cachedSettings = null;

export const invalidateHighchartsDirCache = () => {
    _cachedHighchartsDir = null;
};

export const invalidateSettingsCache = () => {
    _cachedSettings = null;
};

// Dynamic path getters — read config-user.json at call time so worktree
// switching takes effect without a server restart.
export const getHighchartsDir = () => {
    if (_cachedHighchartsDir !== null) {
        return _cachedHighchartsDir;
    }
    const user = f.getLocalJSON(join(__dirname, '../temp/config-user.json')) || {};
    const dir = user.worktreeDir || highchartsDir;
    const resolved = resolve(dir);
    const base = resolve(highchartsDir, '..');
    const rel = relative(base, resolved);
    if (rel.startsWith('..') || isAbsolute(rel)) {
        _cachedHighchartsDir = resolve(highchartsDir);
        return _cachedHighchartsDir;
    }
    if (!existsSync(resolved) && user.worktreeDir) {
        delete user.worktreeDir;
        writeFileSync(
            join(__dirname, '../temp/config-user.json'),
            JSON.stringify(user, null, 4),
            { encoding: 'utf-8', mode: 0o664 }
        );
        _cachedHighchartsDir = resolve(highchartsDir);
        return _cachedHighchartsDir;
    }
    _cachedHighchartsDir = resolved;
    return _cachedHighchartsDir;
};

export const getSamplesDir = () => join(getHighchartsDir(), 'samples');

export const getApiDir = () => join(getHighchartsDir(), 'build/api');
