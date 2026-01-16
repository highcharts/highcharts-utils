/**
 * Core compile-on-demand functionality as reusable functions.
 * These functions are designed to be project-agnostic and can be imported
 * into any project that needs to compile TypeScript master files on demand.
 *
 * @module compile-on-demand-core
 */

import * as esbuild from 'esbuild';
import { join } from 'node:path';
import replacePlugin from 'esbuild-plugin-replace-regex';
import semver from 'semver';

/**
 * @typedef {Object} UMDConfig
 * @property {string} name - The global name (e.g., 'Highcharts', 'Dashboards', 'Grid')
 * @property {string} shortPath - Short path for AMD defines (e.g., 'dashboards')
 * @property {string} path - Full path for AMD defines (e.g., 'highcharts/highcharts')
 * @property {string} filename - The original filename being compiled
 * @property {boolean} isEsModules - Whether this is an ES modules build
 */

/**
 * @typedef {Object} CompileOptions
 * @property {string} highchartsDir - Path to the Highcharts source directory
 * @property {string} [branchName] - Current git branch name for version string
 * @property {Function} [getPackageVersion] - Function that returns the package version
 * @property {Function} [getPlugins] - Custom function to get esbuild plugins
 */

/**
 * @typedef {Object} CompileResult
 * @property {string} code - The compiled JavaScript code
 * @property {number} duration - Compilation time in milliseconds
 */

/**
 * List of primary bundle files that get full UMD wrappers
 * @type {string[]}
 */
export const PRIMARY_FILES = [
    '/dashboards/datagrid.src.js',
    '/grid/grid-lite.src.js',
    '/grid/grid-pro.src.js',
    '/dashboards/dashboards.src.js',
    '/highcharts.src.js',
    '/highcharts-autoload.src.js',
    '/highmaps.src.js',
    '/highstock.src.js',
    '/highcharts-gantt.src.js'
];

/**
 * Path replacement rules for converting request paths to master file paths
 * @type {Array<[RegExp|string, string]>}
 */
export const MASTER_PATH_REPLACEMENTS = [
    // Masters imported directly
    ['/es-modules/masters', ''],
    // Module files called from masters
    ['/masters/es-modules', ''],
    ['/masters/dashboards/es-modules', ''],
    ['/masters/datagrid/es-modules', ''],
    ['/masters/grid/es-modules', ''],
    ['/masters/dashboards/datagrid', '/masters-datagrid/datagrid'],
    ['/masters/dashboards/', '/masters-dashboards/'],
    ['/masters/datagrid/', '/masters-datagrid/'],
    ['/masters/grid/', '/masters-grid/'],
    [/\.js$/, '.ts']
];

/**
 * Check if a filename is a primary bundle file
 * @param {string} filename - The filename to check
 * @returns {boolean}
 */
export function isPrimaryFile(filename) {
    return PRIMARY_FILES.includes(filename);
}

/**
 * Convert a request filename to the corresponding TypeScript master file path
 * @param {string} filename - The request filename (e.g., '/highcharts.src.js')
 * @param {string} highchartsDir - Path to the Highcharts source directory
 * @returns {string} The full path to the master TypeScript file
 */
export function getMasterPath(filename, highchartsDir) {
    let path = `ts/masters${filename}`;

    for (const [from, to] of MASTER_PATH_REPLACEMENTS) {
        if (from instanceof RegExp) {
            path = path.replace(from, to);
        } else {
            path = path.replace(from, to);
        }
    }

    return join(highchartsDir, path);
}

/**
 * Determine the UMD configuration based on the filename
 * @param {string} filename - The filename being compiled
 * @returns {UMDConfig}
 */
export function getUMDConfig(filename) {
    const isEsModules = filename.indexOf('/es-modules/') !== -1;

    // Grid files
    if (
        filename.indexOf('/grid-lite') !== -1 ||
        filename.indexOf('/grid-pro') !== -1 ||
        filename.indexOf('/datagrid') !== -1
    ) {
        return {
            name: 'Grid',
            shortPath: 'dashboards',
            path: 'dashboards/dashboards',
            filename,
            isEsModules
        };
    }

    // Dashboards files
    if (filename.indexOf('/dashboards') === 0) {
        return {
            name: 'Dashboards',
            shortPath: 'dashboards',
            path: 'dashboards/dashboards',
            filename,
            isEsModules
        };
    }

    // Default: Highcharts
    return {
        name: 'Highcharts',
        shortPath: 'dashboards',
        path: 'highcharts/highcharts',
        filename,
        isEsModules
    };
}

/**
 * Replace the contents of a file import in the generated bundle
 * @param {string} js - The JavaScript code
 * @param {string} path - The file path to replace
 * @param {string} [replacement] - The replacement code. If undefined, creates a namespace lookup.
 * @returns {string} The modified JavaScript code
 */
export function replaceFileContent(js, path, replacement) {
    const escapedPath = path.replace(/\./g, '\\.').replace(/\//g, '\\/');
    // Match both ../highcharts/ts/ format and tmp/branch/ts/ format
    const pathPrefix = '(?:\\.\\.\\/highcharts\\/ts|tmp\\/[^\\/]+\\/ts)';
    const regex = new RegExp(
        `(\\/\\/ ${pathPrefix}\\/${escapedPath})[\\s\\S]+?(\\/\\/ ${pathPrefix}\\/)`
    );

    // If a replacement is not defined, assume the object exists on the
    // Highcharts namespace.
    const filename = path.split(/[\/\.]/g).at(-2);
    const actualReplacement = typeof replacement === 'undefined'
        ? `
            var ${filename}_default = (
                window.Dashboards?.${filename} ||
                window.Highcharts?.${filename}
            );
        `
        : replacement;

    return js.replace(
        regex,
        `$1\n  // File replaced by post-processing in utils\n  ${actualReplacement}\n\n  $2`
    );
}

/**
 * Get the default file replacements for a UMD build
 * @param {UMDConfig} umdConfig - The UMD configuration
 * @returns {Object<string, string|undefined>} Map of file paths to replacement code
 */
export function getDefaultReplacements(umdConfig) {
    const replacements = {
        'Core/Globals.ts': `var Globals_default = ${umdConfig.name};`,

        // These ones are mapped directly to Highcharts.SomeProperty
        'Core/Animation/Fx.ts': undefined,
        'Core/Axis/Axis.ts': undefined,
        'Core/Axis/Tick.ts': undefined,
        'Core/Chart/Chart.ts': undefined,
        'Core/Color/Color.ts': undefined,
        'Core/Legend/Legend.ts': undefined,
        'Core/Renderer/HTML/AST.ts': undefined,
        'Core/Renderer/SVG/SVGElement.ts': undefined,
        'Core/Renderer/SVG/SVGRenderer.ts': undefined,
        'Core/Series/Point.ts': undefined,
        'Core/Series/Series.ts': undefined,
        'Core/Axis/Stacking/StackItem.ts': undefined,
        'Core/Time.ts': undefined,
        'Core/Templating.ts': undefined,
        'Dashboards/Components/ComponentRegistry.ts': undefined,
        'Data/Modifiers/DataModifier.ts': undefined,

        // These ones are called internally from dependencies of the primary
        // bundles and are not needed in secondary bundles
        'Core/Foundation.ts': '',
        'Core/Renderer/SVG/SVGLabel.ts': '',
        'Core/Renderer/SVG/TextBuilder.ts': '',

        'Core/Defaults.ts': `var Defaults_default = {
            defaultOptions: ${umdConfig.name}.defaultOptions,
            defaultTime: ${umdConfig.name}.time,
            getOptions: ${umdConfig.name}.getOptions,
            setOptions: ${umdConfig.name}.setOptions
        };`,
        'Core/Renderer/RendererRegistry.ts': `
            var RendererRegistry_default = {
                // Simple override because SVGRenderer is the only renderer now
                getRendererType: () => ${umdConfig.name}.SVGRenderer
            };
        `,
        'Core/Series/SeriesDefaults.ts': `
            var SeriesDefaults_default = ${umdConfig.name}.Series
                .defaultOptions;
        `,
        'Extensions/DataGrouping/ApproximationRegistry.ts':
            `var ApproximationRegistry_default = ${umdConfig.name}.dataGrouping?.approximations || {};`,
        'Series/Column/ColumnSeries.ts':
            `var ColumnSeries_default = ${umdConfig.name}.seriesTypes.column;`,
        'Shared/TimeBase.ts': `var TimeBase_default = ${umdConfig.name}.Time;`,
    };

    // If the Core/Utilities.ts file is loaded in a Dashboards module (like
    // layout.js), we need to preserve the included object.
    if (umdConfig.name !== 'Dashboards') {
        replacements['Core/Utilities.ts'] = `var Utilities_default =
            window.Highcharts || window.Dashboards || window.Grid;
        `;
    }

    return replacements;
}

/**
 * Perform static replacements to the code that esbuild generates
 * @param {string} js - The JavaScript code
 * @param {UMDConfig} umdConfig - The UMD configuration
 * @param {Object<string, string|undefined>} [customReplacements] - Custom replacements to merge
 * @returns {string} The modified JavaScript code
 */
export function applyReplacements(jsInput, umdConfig, customReplacements = {}) {
    const replacements = {
        ...getDefaultReplacements(umdConfig),
        ...customReplacements
    };

    let result = jsInput;
    for (const [path, replacement] of Object.entries(replacements)) {
        result = replaceFileContent(result, path, replacement);
    }

    if (!umdConfig.isEsModules) {
        result = result.replace('var Globals;', `var Globals = ${umdConfig.name};`);
    }

    return result
        .replace(/Globals_default2/g, umdConfig.name)
        .replace(/@product.assetPrefix@/g, `/code/${umdConfig.shortPath}`)
        // Reverse-engineer the SeriesRegistry
        .replace(
            'var SeriesRegistry_default = SeriesRegistry;',
            `var SeriesRegistry_default = ${umdConfig.name}?.Series ? {
                registerSeriesType: ${umdConfig.name}.Series.registerType,
                seriesTypes: ${umdConfig.name}.Series.types,
                series: ${umdConfig.name}.Series
            } : SeriesRegistry;`
        );
}

/**
 * Generate the UMD header for primary files
 * @param {UMDConfig} umdConfig - The UMD configuration
 * @returns {string}
 */
export function generatePrimaryUMDHeader(umdConfig) {
    return `(function (root, factory) {
if (typeof module === 'object' && module.exports) {
    factory['default'] = factory;
    module.exports = root.document ?
        factory(root) :
        factory;
} else if (typeof define === 'function' && define.amd) {
    define('${umdConfig.path}', function () {
        return factory(root);
    });
} else {
    if (root.${umdConfig.name}) {
        root.${umdConfig.name}.error?.(16, true);
    }
    root.${umdConfig.name} = factory(root);
}
}(typeof window !== 'undefined' ? window : this, function (window) {`;
}

/**
 * Generate the UMD header for module files
 * @param {UMDConfig} umdConfig - The UMD configuration
 * @param {string} filename - The filename for the AMD define
 * @returns {string}
 */
export function generateModuleUMDHeader(umdConfig, filename) {
    return `(function (factory) {
if (typeof module === 'object' && module.exports) {
    factory['default'] = factory;
    module.exports = factory;
} else if (typeof define === 'function' && define.amd) {
    define('${filename}', ['${umdConfig.shortPath}'], function (${umdConfig.name}) {
        factory(${umdConfig.name});
        factory.${umdConfig.name} = ${umdConfig.name};
        return factory;
    });
} else {
    factory(typeof ${umdConfig.name} !== 'undefined' ? ${umdConfig.name} : undefined);
}
}(function (${umdConfig.name}) {
    `;
}

/**
 * Generate the UMD footer
 * @param {UMDConfig} umdConfig - The UMD configuration
 * @param {boolean} isPrimary - Whether this is a primary file
 * @returns {string}
 */
export function generateUMDFooter(umdConfig, isPrimary) {
    if (umdConfig.isEsModules) {
        return '';
    }
    return isPrimary
        ? `return ${umdConfig.name}.default || ${umdConfig.name}; }));`
        : '}));';
}

/**
 * Get legacy compatibility plugins for older Highcharts versions
 * @param {string} version - The package version
 * @returns {Promise<Array>} Array of esbuild plugins
 */
export async function getLegacyPlugins(version) {
    if (semver.lt(version, '11.2.0')) {
        return [replacePlugin({
            filter: /(highcharts\.src\.ts|DataLabel\.ts|PlotLineOrBandAxis\.ts|TreemapUtilities\.ts)/,
            patterns: [
                // highcharts.src.ts
                [
                    /G.addEvent = Utilities.addEvent;/,
                    `Utilities.extend(G, Utilities);
                    G.addEvent = Utilities.addEvent;`
                ],
                // PlotLineOrBandAxis.ts
                [
                    /options: \(PlotBandOptions\|PlotLineOptions\) = this\.options\s+\): SVGPath \{/,
                    'options?: (PlotBandOptions|PlotLineOptions)\n    ): SVGPath {\n    options ??= this.options;\n'
                ],
                // DataLabel.ts
                [
                    /points: Array<Point> = this\.points\s+\): void \{/,
                    'points?: Array<Point>\n    ): void {\n    points ??= this.points;\n'
                ],
                // TreemapUtilities.ts
                [
                    /context: TContext = this\s+\): void \{/,
                    'context?: TContext\n    ): void {\n    context ??= this;\n'
                ]
            ]
        })];
    }
    return [];
}

/**
 * Build esbuild configuration for compilation
 * @param {string} masterPath - Path to the master TypeScript file
 * @param {UMDConfig} umdConfig - The UMD configuration
 * @param {boolean} isPrimary - Whether this is a primary file
 * @param {Array} plugins - Array of esbuild plugins
 * @returns {Object} esbuild build configuration
 */
export function buildEsbuildConfig(masterPath, umdConfig, isPrimary, plugins) {
    let banner = '';
    let footer = '';

    if (!umdConfig.isEsModules) {
        banner = isPrimary
            ? generatePrimaryUMDHeader(umdConfig)
            : generateModuleUMDHeader(umdConfig, umdConfig.filename);
        footer = generateUMDFooter(umdConfig, isPrimary);
    }

    return {
        entryPoints: [masterPath],
        bundle: !umdConfig.isEsModules,
        write: false,
        globalName: umdConfig.name + (isPrimary ? '' : 'Module'),
        plugins,
        banner: { js: banner },
        footer: { js: footer }
    };
}

/**
 * Compile a file on demand
 * @param {string} filename - The filename to compile (e.g., '/highcharts.src.js')
 * @param {CompileOptions} options - Compilation options
 * @returns {Promise<CompileResult>} The compilation result
 */
export async function compile(filename, options) {
    const { highchartsDir, branchName = 'unknown', getPackageVersion, getPlugins } = options;

    const isPrimary = isPrimaryFile(filename);
    const masterPath = getMasterPath(filename, highchartsDir);
    const umdConfig = getUMDConfig(filename);
    const start = Date.now();

    // Get plugins - either custom or legacy
    let plugins = [];
    if (getPlugins) {
        plugins = await getPlugins();
    } else if (getPackageVersion) {
        const version = await getPackageVersion();
        plugins = await getLegacyPlugins(version);
    }

    const esbuildConfig = buildEsbuildConfig(masterPath, umdConfig, isPrimary, plugins);

    let js;
    const result = await esbuild.build(esbuildConfig).catch((e) => {
        js = `console.error(\`${e}\`);`;
    });

    if (result) {
        js = result.outputFiles[0].text;

        js = js.replace(
            '"@product.version@"',
            `"Compiled on demand from ${branchName}"`
        );

        if (!isPrimary) {
            js = applyReplacements(js, umdConfig);
        }

        const duration = Date.now() - start;
        js += `
        console.info(
            '%cCompiled on demand: ${filename} (${duration} ms)',
            'color:green'
        );`;

        return { code: js, duration };
    }

    return { code: js, duration: Date.now() - start };
}

export default {
    PRIMARY_FILES,
    MASTER_PATH_REPLACEMENTS,
    isPrimaryFile,
    getMasterPath,
    getUMDConfig,
    replaceFileContent,
    getDefaultReplacements,
    applyReplacements,
    generatePrimaryUMDHeader,
    generateModuleUMDHeader,
    generateUMDFooter,
    getLegacyPlugins,
    buildEsbuildConfig,
    compile
};
