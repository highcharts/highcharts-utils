const esbuild = require('esbuild');
const { highchartsDir } = require('./arguments.js');
const { join } = require('path');

// Replace the contents of a file import in the generated bundle
const replaceFileContent = (js, filename, replacement) => {
    const regex = new RegExp(
        '(\\/\\/ \\.\\.\\/highcharts\\/ts\\/' +
        // escape
        filename.replace(/\./g, '\\.').replace(/\//g, '\\/') +
        ')[\\s\\S]+?(\\/\\/ \\.\\.\\/highcharts\\/ts\\/)'
    );
    return js.replace(
        regex,
        `$1\n  // File replaced by post-processin in utils\n  ${replacement}\n\n  $2`
    );

}

// Perform static replacements to the code that esbuild generates. Primarily
// this deals with components that are redefined in secondary bundles, so that
// state is lost when the local components are modified.
const replace = js => {
    // Remove whole imports
    js = replaceFileContent(
        js,
        'Core/Globals.ts',
        'var Globals_default = Highcharts;'
    );

    js = replaceFileContent(
        js,
        'Core/Chart/Chart.ts',
        'var Chart_default = Highcharts.Chart;'
    );

    js = replaceFileContent(
        js,
        'Core/Series/Series.ts',
        'var Series_default = Highcharts.Series;'
    );

    js = replaceFileContent(
        js,
        'Core/Renderer/SVG/SVGElement.ts',
        'var SVGElement_default = Highcharts.SVGElement;'
    );

    js = replaceFileContent(
        js,
        'Core/Renderer/SVG/SVGRenderer.ts',
        'var SVGRenderer_default = Highcharts.SVGRenderer;'
    );

    return js
        .replace('var Globals;', 'var Globals = Highcharts;')

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
        );
}


const compile = async (path) => {
    const isPrimaryFile = [
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
        globalName: isPrimaryFile ? 'Highcharts' : 'HighchartsModule',
        banner: {
            js: isPrimaryFile ?

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
    define('${path}', ['highcharts'], function (Highcharts) {
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
                isPrimaryFile ?
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

        if (!isPrimaryFile) {
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