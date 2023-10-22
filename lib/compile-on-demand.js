const esbuild = require('esbuild');
const { highchartsDir } = require('./arguments.js');
const { join } = require('path');

// Perform static replacements to the code that esbuild generates. Primarily
// this deals with components that are redefined in module bundles, so that
// state is lost when the local components are modified.
const replace = js => js
    .replace('var Globals;', 'var Globals = Highcharts;')
    .replace('var Globals_default = Globals;')

    // In map.src.js
    .replace(
        'var Chart = class _Chart {',
        'var Chart = Highcharts?.Chart || class _Chart {'
    )

    .replace(
        'var defaultOptions = {',
        'var defaultOptions = Highcharts?.defaultOptions || {'
    )

    // Reverse-engineer the SeriesRegistry
    .replace(
        'var SeriesRegistry_default = SeriesRegistry;',
        `var SeriesRegistry_default = Highcharts?.Series ? {
            registerSeriesType: Highcharts.Series.registerType,
            seriesTypes: Highcharts.Series.types,
            series: Highcharts.Series
        } : SeriesRegistry;`
    )

    .replace(
        'var Series = class {',
        'var Series = Highcharts?.Series || class {'
    );


const compile = async (path) => {
    const isMainFile = [
            '/highcharts.src.js',
            '/highmaps.src.js',
            '/highstock.src.js',
            '/highcharts-gantt.src.js'
        ].includes(path),
        start = Date.now();

    let js;

    const result = await esbuild.build({
        entryPoints: [join(highchartsDir, 'ts/masters', path)],
        bundle: true,
        write: false,
        globalName: 'Highcharts',
        banner: {
            js: isMainFile ?

// UMD header for main files
`(function (root, factory) {
if (typeof module === 'object' && module.exports) {
    factory['default'] = factory;
    module.exports = root.document ?
        factory(root) :
        factory;
} else if (typeof define === 'function' && define.amd) {
    define('highcharts/highcharts', function () {
        return factory(root);
    });
} else {
    if (root.Highcharts) {
        root.Highcharts.error(16, true);
    }
    root.Highcharts = factory(root);
}
}(typeof window !== 'undefined' ? window : this, function (window) {` :

// UMD header for module files
`(function (factory) {
if (typeof module === 'object' && module.exports) {
    factory['default'] = factory;
    module.exports = factory;
} else if (typeof define === 'function' && define.amd) {
    define('highcharts/modules/exporting', ['highcharts'], function (Highcharts) {
        factory(Highcharts);
        factory.Highcharts = Highcharts;
        return factory;
    });
} else {
    factory(typeof Highcharts !== 'undefined' ? Highcharts : undefined);
}
}(function (Highcharts) {`
        },
        footer: {
            js: (
                isMainFile ?
                    'return Highcharts.default; }));' :
                    '}));'
            )
        }
    }).catch(() => {
        js = `console.info(
            '%cFailed to compile on demand - file not found: ${path}',
            'color:red'
        );`
    });

    if (result) {
        js = result.outputFiles[0].text;

        if (!isMainFile) {
            js = replace(js);
        }
        const ms = Date.now() - start;
        js += `console.info(
            '%cCompiled on demand: ${path} (${ms} ms)',
            'color:green'
        );`
    }
    return js;
}


module.exports = {
	compile
};