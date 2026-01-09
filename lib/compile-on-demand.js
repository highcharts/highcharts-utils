/**
 * Compile-on-demand functionality for highcharts-utils.
 *
 * This file wraps the reusable core functions from compile-on-demand-core.js
 * with project-specific configuration (highchartsDir, branch name, etc.)
 *
 * For reusable functions that can be used in other projects, see:
 * @see ./compile-on-demand-core.js
 */

import { join } from 'node:path';
import { highchartsDir } from './arguments.js';
import { getBranch, getLocalJSON } from './functions.js';
import {
    getMasterPath as getMasterPathCore,
    compile as compileCore,
    getLegacyPlugins
} from './compile-on-demand-core.js';

// Re-export core functions for direct access if needed
export {
    PRIMARY_FILES,
    MASTER_PATH_REPLACEMENTS,
    isPrimaryFile,
    getUMDConfig,
    replaceFileContent,
    getDefaultReplacements,
    applyReplacements,
    generatePrimaryUMDHeader,
    generateModuleUMDHeader,
    generateUMDFooter,
    buildEsbuildConfig
} from './compile-on-demand-core.js';

/**
 * Get esbuild plugins for legacy Highcharts version compatibility.
 * Reads the package version from the configured highchartsDir.
 * @returns {Promise<Array>} Array of esbuild plugins
 */
const getPlugins = async () => {
    const pckg = getLocalJSON(join(highchartsDir, 'package.json'));
    const version = pckg.version;
    return getLegacyPlugins(version);
};

/**
 * Get the master file path for a given filename.
 * Uses the configured highchartsDir from arguments.
 *
 * @param {string} filename - The filename to convert (e.g., '/highcharts.src.js')
 * @returns {string} The full path to the master TypeScript file
 */
export const getMasterPath = (filename) => {
    return getMasterPathCore(filename, highchartsDir);
};

/**
 * Compile a file on demand using the configured highchartsDir.
 *
 * @param {string} filename - The filename to compile (e.g., '/highcharts.src.js')
 * @returns {Promise<string>} The compiled JavaScript code
 */
export const compile = async (filename) => {
    const result = await compileCore(filename, {
        highchartsDir,
        branchName: getBranch(),
        getPlugins
    });

    return result.code;
};
