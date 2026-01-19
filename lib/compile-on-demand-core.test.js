/**
 * Unit tests for compile-on-demand-core.js
 *
 * Run with: node --test lib/compile-on-demand-core.test.js
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
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
    buildEsbuildConfig
} from './compile-on-demand-core.js';

describe('isPrimaryFile', () => {
    test('should return true for primary bundle files', () => {
        assert.strictEqual(isPrimaryFile('/highcharts.src.js'), true);
        assert.strictEqual(isPrimaryFile('/highstock.src.js'), true);
        assert.strictEqual(isPrimaryFile('/highmaps.src.js'), true);
        assert.strictEqual(isPrimaryFile('/highcharts-gantt.src.js'), true);
        assert.strictEqual(isPrimaryFile('/dashboards/dashboards.src.js'), true);
        assert.strictEqual(isPrimaryFile('/grid/grid-lite.src.js'), true);
        assert.strictEqual(isPrimaryFile('/grid/grid-pro.src.js'), true);
    });

    test('should return false for module files', () => {
        assert.strictEqual(isPrimaryFile('/modules/exporting.src.js'), false);
        assert.strictEqual(isPrimaryFile('/modules/data.src.js'), false);
        assert.strictEqual(isPrimaryFile('/indicators/rsi.src.js'), false);
    });

    test('should return false for non-matching paths', () => {
        assert.strictEqual(isPrimaryFile('/highcharts.js'), false);
        assert.strictEqual(isPrimaryFile('highcharts.src.js'), false);
        assert.strictEqual(isPrimaryFile('/random/file.js'), false);
    });
});

describe('getMasterPath', () => {
    const mockHighchartsDir = '/path/to/highcharts';

    test('should convert .js extension to .ts', () => {
        const result = getMasterPath('/highcharts.src.js', mockHighchartsDir);
        assert.ok(result.endsWith('.ts'));
        assert.ok(!result.endsWith('.js'));
    });

    test('should build correct path for main highcharts file', () => {
        const result = getMasterPath('/highcharts.src.js', mockHighchartsDir);
        assert.strictEqual(result, '/path/to/highcharts/ts/masters/highcharts.src.ts');
    });

    test('should build correct path for module files', () => {
        const result = getMasterPath('/modules/exporting.src.js', mockHighchartsDir);
        assert.strictEqual(result, '/path/to/highcharts/ts/masters/modules/exporting.src.ts');
    });

    test('should handle es-modules path replacement', () => {
        const result = getMasterPath('/es-modules/masters/highcharts.src.js', mockHighchartsDir);
        // Should remove /es-modules/masters and become just the filename
        assert.ok(result.includes('highcharts.src.ts'));
    });

    test('should handle dashboards path replacement', () => {
        const result = getMasterPath('/masters/dashboards/dashboards.src.js', mockHighchartsDir);
        assert.ok(result.includes('masters-dashboards'));
    });

    test('should handle grid path replacement', () => {
        const result = getMasterPath('/masters/grid/grid-lite.src.js', mockHighchartsDir);
        assert.ok(result.includes('masters-grid'));
    });
});

describe('getUMDConfig', () => {
    test('should return Highcharts config for main file', () => {
        const config = getUMDConfig('/highcharts.src.js');
        assert.strictEqual(config.name, 'Highcharts');
        assert.strictEqual(config.path, 'highcharts/highcharts');
        assert.strictEqual(config.isEsModules, false);
    });

    test('should return Highcharts config for stock file', () => {
        const config = getUMDConfig('/highstock.src.js');
        assert.strictEqual(config.name, 'Highcharts');
    });

    test('should return Highcharts config for modules', () => {
        const config = getUMDConfig('/modules/exporting.src.js');
        assert.strictEqual(config.name, 'Highcharts');
    });

    test('should return Dashboards config for dashboards files', () => {
        const config = getUMDConfig('/dashboards/dashboards.src.js');
        assert.strictEqual(config.name, 'Dashboards');
        assert.strictEqual(config.path, 'dashboards/dashboards');
    });

    test('should return Grid config for grid-lite files', () => {
        const config = getUMDConfig('/grid/grid-lite.src.js');
        assert.strictEqual(config.name, 'Grid');
    });

    test('should return Grid config for grid-pro files', () => {
        const config = getUMDConfig('/grid/grid-pro.src.js');
        assert.strictEqual(config.name, 'Grid');
    });

    test('should return Grid config for datagrid files', () => {
        const config = getUMDConfig('/dashboards/datagrid.src.js');
        assert.strictEqual(config.name, 'Grid');
    });

    test('should detect ES modules from path', () => {
        const config = getUMDConfig('/es-modules/masters/highcharts.src.js');
        assert.strictEqual(config.isEsModules, true);
    });

    test('should not detect ES modules for regular paths', () => {
        const config = getUMDConfig('/highcharts.src.js');
        assert.strictEqual(config.isEsModules, false);
    });

    test('should preserve the original filename', () => {
        const filename = '/modules/exporting.src.js';
        const config = getUMDConfig(filename);
        assert.strictEqual(config.filename, filename);
    });
});

describe('replaceFileContent', () => {
    const mockJs = `
        // ../highcharts/ts/Core/Globals.ts
        var Globals = {};
        Globals.doc = document;
        // ../highcharts/ts/Core/Utilities.ts
        var Utilities = {};
    `;

    test('should replace file content with custom replacement', () => {
        const result = replaceFileContent(mockJs, 'Core/Globals.ts', 'var Globals_default = MyGlobals;');
        assert.ok(result.includes('var Globals_default = MyGlobals;'));
        assert.ok(result.includes('File replaced by post-processing'));
    });

    test('should generate namespace lookup when replacement is undefined', () => {
        const result = replaceFileContent(mockJs, 'Core/Globals.ts', undefined);
        assert.ok(result.includes('window.Dashboards?.Globals'));
        assert.ok(result.includes('window.Highcharts?.Globals'));
    });

    test('should preserve surrounding content', () => {
        const result = replaceFileContent(mockJs, 'Core/Globals.ts', 'var Globals_default = X;');
        assert.ok(result.includes('// ../highcharts/ts/Core/Utilities.ts'));
    });

    test('should handle empty replacement string', () => {
        const result = replaceFileContent(mockJs, 'Core/Globals.ts', '');
        assert.ok(result.includes('// ../highcharts/ts/Core/Globals.ts'));
    });
});

describe('getDefaultReplacements', () => {
    test('should include Globals replacement', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: false };
        const replacements = getDefaultReplacements(umdConfig);
        assert.strictEqual(replacements['Core/Globals.ts'], 'var Globals_default = Highcharts;');
    });

    test('should include undefined mappings for namespace properties', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: false };
        const replacements = getDefaultReplacements(umdConfig);
        assert.strictEqual(replacements['Core/Chart/Chart.ts'], undefined);
        assert.strictEqual(replacements['Core/Series/Series.ts'], undefined);
    });

    test('should include empty string mappings for internal-only files', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: false };
        const replacements = getDefaultReplacements(umdConfig);
        assert.strictEqual(replacements['Core/Foundation.ts'], '');
    });

    test('should include Utilities replacement for non-Dashboards', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: false };
        const replacements = getDefaultReplacements(umdConfig);
        assert.ok(replacements['Core/Utilities.ts']);
        assert.ok(replacements['Core/Utilities.ts'].includes('window.Highcharts'));
    });

    test('should expose Defaults helpers on the namespace', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: false };
        const replacements = getDefaultReplacements(umdConfig);
        const defaultsReplacement = replacements['Core/Defaults.ts'];
        assert.ok(defaultsReplacement.includes('defaultOptions: Highcharts.defaultOptions'));
        assert.ok(defaultsReplacement.includes('defaultTime: Highcharts.time'));
        assert.ok(defaultsReplacement.includes('getOptions: Highcharts.getOptions'));
        assert.ok(defaultsReplacement.includes('setOptions: Highcharts.setOptions'));
    });

    test('should not include Utilities replacement for Dashboards', () => {
        const umdConfig = { name: 'Dashboards', isEsModules: false };
        const replacements = getDefaultReplacements(umdConfig);
        assert.strictEqual(replacements['Core/Utilities.ts'], undefined);
    });

    test('should use correct global name in replacements', () => {
        const umdConfig = { name: 'Grid', isEsModules: false };
        const replacements = getDefaultReplacements(umdConfig);
        assert.ok(replacements['Core/Globals.ts'].includes('Grid'));
        assert.ok(replacements['Core/Defaults.ts'].includes('Grid'));
    });
});

describe('applyReplacements', () => {
    test('should replace Globals_default2 with the umd name', () => {
        const js = 'var x = Globals_default2.doc;';
        const umdConfig = { name: 'Highcharts', isEsModules: false, shortPath: 'dashboards' };
        const result = applyReplacements(js, umdConfig);
        assert.ok(result.includes('Highcharts.doc'));
        assert.ok(!result.includes('Globals_default2'));
    });

    test('should replace @product.assetPrefix@', () => {
        const js = 'var path = "@product.assetPrefix@/file.js";';
        const umdConfig = { name: 'Highcharts', isEsModules: false, shortPath: 'mypath' };
        const result = applyReplacements(js, umdConfig);
        assert.ok(result.includes('/code/mypath'));
        assert.ok(!result.includes('@product.assetPrefix@'));
    });

    test('should replace var Globals for non-ES modules', () => {
        const js = 'var Globals;';
        const umdConfig = { name: 'Highcharts', isEsModules: false, shortPath: 'dashboards' };
        const result = applyReplacements(js, umdConfig);
        assert.ok(result.includes('var Globals = Highcharts;'));
    });

    test('should not replace var Globals for ES modules', () => {
        const js = 'var Globals;';
        const umdConfig = { name: 'Highcharts', isEsModules: true, shortPath: 'dashboards' };
        const result = applyReplacements(js, umdConfig);
        assert.ok(result.includes('var Globals;'));
    });

    test('should handle SeriesRegistry replacement', () => {
        const js = 'var SeriesRegistry_default = SeriesRegistry;';
        const umdConfig = { name: 'Highcharts', isEsModules: false, shortPath: 'dashboards' };
        const result = applyReplacements(js, umdConfig);
        assert.ok(result.includes('Highcharts?.Series'));
        assert.ok(result.includes('registerSeriesType'));
    });

    test('should merge custom replacements', () => {
        const mockJs = `
            // ../highcharts/ts/Custom/File.ts
            var CustomFile = {};
            // ../highcharts/ts/Core/Globals.ts
        `;
        const umdConfig = { name: 'Highcharts', isEsModules: false, shortPath: 'dashboards' };
        const customReplacements = {
            'Custom/File.ts': 'var CustomFile_default = MyCustom;'
        };
        const result = applyReplacements(mockJs, umdConfig, customReplacements);
        assert.ok(result.includes('var CustomFile_default = MyCustom;'));
    });
});

describe('generatePrimaryUMDHeader', () => {
    test('should generate IIFE wrapper', () => {
        const umdConfig = { name: 'Highcharts', path: 'highcharts/highcharts' };
        const header = generatePrimaryUMDHeader(umdConfig);
        assert.ok(header.includes('(function (root, factory)'));
    });

    test('should include CommonJS support', () => {
        const umdConfig = { name: 'Highcharts', path: 'highcharts/highcharts' };
        const header = generatePrimaryUMDHeader(umdConfig);
        assert.ok(header.includes('module.exports'));
    });

    test('should include AMD support', () => {
        const umdConfig = { name: 'Highcharts', path: 'highcharts/highcharts' };
        const header = generatePrimaryUMDHeader(umdConfig);
        assert.ok(header.includes('define('));
        assert.ok(header.includes('highcharts/highcharts'));
    });

    test('should include global fallback', () => {
        const umdConfig = { name: 'Highcharts', path: 'highcharts/highcharts' };
        const header = generatePrimaryUMDHeader(umdConfig);
        assert.ok(header.includes('root.Highcharts = factory(root)'));
    });

    test('should include error check for existing global', () => {
        const umdConfig = { name: 'Highcharts', path: 'highcharts/highcharts' };
        const header = generatePrimaryUMDHeader(umdConfig);
        assert.ok(header.includes('root.Highcharts.error'));
    });

    test('should use correct global name', () => {
        const umdConfig = { name: 'Dashboards', path: 'dashboards/dashboards' };
        const header = generatePrimaryUMDHeader(umdConfig);
        assert.ok(header.includes('root.Dashboards'));
        assert.ok(!header.includes('root.Highcharts'));
    });
});

describe('generateModuleUMDHeader', () => {
    test('should generate IIFE wrapper', () => {
        const umdConfig = { name: 'Highcharts', shortPath: 'highcharts' };
        const header = generateModuleUMDHeader(umdConfig, '/modules/exporting.src.js');
        assert.ok(header.includes('(function (factory)'));
    });

    test('should include CommonJS support', () => {
        const umdConfig = { name: 'Highcharts', shortPath: 'highcharts' };
        const header = generateModuleUMDHeader(umdConfig, '/modules/exporting.src.js');
        assert.ok(header.includes('module.exports = factory'));
    });

    test('should include AMD define with dependencies', () => {
        const umdConfig = { name: 'Highcharts', shortPath: 'highcharts' };
        const header = generateModuleUMDHeader(umdConfig, '/modules/exporting.src.js');
        assert.ok(header.includes("define('/modules/exporting.src.js'"));
        assert.ok(header.includes("['highcharts']"));
    });

    test('should pass global to factory', () => {
        const umdConfig = { name: 'Highcharts', shortPath: 'highcharts' };
        const header = generateModuleUMDHeader(umdConfig, '/modules/exporting.src.js');
        assert.ok(header.includes('factory(Highcharts)'));
    });

    test('should use correct global name for Dashboards', () => {
        const umdConfig = { name: 'Dashboards', shortPath: 'dashboards' };
        const header = generateModuleUMDHeader(umdConfig, '/modules/layout.src.js');
        assert.ok(header.includes('Dashboards'));
        assert.ok(header.includes("['dashboards']"));
    });
});

describe('generateUMDFooter', () => {
    test('should return empty string for ES modules', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: true };
        const footer = generateUMDFooter(umdConfig, true);
        assert.strictEqual(footer, '');
    });

    test('should return primary footer with return statement', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: false };
        const footer = generateUMDFooter(umdConfig, true);
        assert.ok(footer.includes('return Highcharts.default || Highcharts'));
        assert.ok(footer.includes('}));'));
    });

    test('should return simple footer for module files', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: false };
        const footer = generateUMDFooter(umdConfig, false);
        assert.strictEqual(footer, '}));');
    });

    test('should use correct global name', () => {
        const umdConfig = { name: 'Dashboards', isEsModules: false };
        const footer = generateUMDFooter(umdConfig, true);
        assert.ok(footer.includes('Dashboards.default || Dashboards'));
    });
});

describe('buildEsbuildConfig', () => {
    test('should set correct entry points', () => {
        const masterPath = '/path/to/master.ts';
        const umdConfig = { name: 'Highcharts', isEsModules: false, filename: '/test.js' };
        const config = buildEsbuildConfig(masterPath, umdConfig, true, []);
        assert.deepStrictEqual(config.entryPoints, [masterPath]);
    });

    test('should bundle for non-ES modules', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: false, filename: '/test.js' };
        const config = buildEsbuildConfig('/path.ts', umdConfig, true, []);
        assert.strictEqual(config.bundle, true);
    });

    test('should not bundle for ES modules', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: true, filename: '/test.js' };
        const config = buildEsbuildConfig('/path.ts', umdConfig, true, []);
        assert.strictEqual(config.bundle, false);
    });

    test('should set write to false', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: false, filename: '/test.js' };
        const config = buildEsbuildConfig('/path.ts', umdConfig, true, []);
        assert.strictEqual(config.write, false);
    });

    test('should set correct globalName for primary files', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: false, filename: '/test.js' };
        const config = buildEsbuildConfig('/path.ts', umdConfig, true, []);
        assert.strictEqual(config.globalName, 'Highcharts');
    });

    test('should set correct globalName with Module suffix for non-primary', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: false, filename: '/test.js' };
        const config = buildEsbuildConfig('/path.ts', umdConfig, false, []);
        assert.strictEqual(config.globalName, 'HighchartsModule');
    });

    test('should include plugins', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: false, filename: '/test.js' };
        const plugins = [{ name: 'test-plugin' }];
        const config = buildEsbuildConfig('/path.ts', umdConfig, true, plugins);
        assert.deepStrictEqual(config.plugins, plugins);
    });

    test('should include banner for non-ES modules', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: false, path: 'highcharts/highcharts', filename: '/test.js' };
        const config = buildEsbuildConfig('/path.ts', umdConfig, true, []);
        assert.ok(config.banner.js.includes('(function'));
    });

    test('should include empty banner for ES modules', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: true, filename: '/test.js' };
        const config = buildEsbuildConfig('/path.ts', umdConfig, true, []);
        assert.strictEqual(config.banner.js, '');
    });

    test('should include footer for non-ES modules', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: false, path: 'highcharts/highcharts', filename: '/test.js' };
        const config = buildEsbuildConfig('/path.ts', umdConfig, true, []);
        assert.ok(config.footer.js.includes('}));'));
    });

    test('should include empty footer for ES modules', () => {
        const umdConfig = { name: 'Highcharts', isEsModules: true, filename: '/test.js' };
        const config = buildEsbuildConfig('/path.ts', umdConfig, true, []);
        assert.strictEqual(config.footer.js, '');
    });
});

describe('PRIMARY_FILES constant', () => {
    test('should contain expected primary files', () => {
        assert.ok(PRIMARY_FILES.includes('/highcharts.src.js'));
        assert.ok(PRIMARY_FILES.includes('/highstock.src.js'));
        assert.ok(PRIMARY_FILES.includes('/highmaps.src.js'));
        assert.ok(PRIMARY_FILES.includes('/highcharts-gantt.src.js'));
        assert.ok(PRIMARY_FILES.includes('/dashboards/dashboards.src.js'));
    });

    test('should be an array', () => {
        assert.ok(Array.isArray(PRIMARY_FILES));
    });
});

describe('MASTER_PATH_REPLACEMENTS constant', () => {
    test('should be an array of replacement pairs', () => {
        assert.ok(Array.isArray(MASTER_PATH_REPLACEMENTS));
        for (const [from, to] of MASTER_PATH_REPLACEMENTS) {
            assert.ok(typeof from === 'string' || from instanceof RegExp);
            assert.ok(typeof to === 'string');
        }
    });

    test('should include .js to .ts replacement', () => {
        const hasJsToTs = MASTER_PATH_REPLACEMENTS.some(
            ([from]) => from instanceof RegExp && from.test('.js')
        );
        assert.ok(hasJsToTs);
    });
});
