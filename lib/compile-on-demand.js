const esbuild = require('esbuild');
const { highchartsDir } = require('./arguments.js');
const { join } = require('path');

// Replace the contents of a file import in the generated bundle
const replaceFileContent = (js, path, replacement) => {
    const regex = new RegExp(
        '(\\/\\/ \\.\\.\\/highcharts\\/ts\\/' +
        // escape
        path.replace(/\./g, '\\.').replace(/\//g, '\\/') +
        ')[\\s\\S]+?(\\/\\/ \\.\\.\\/highcharts\\/ts\\/)'
    );

    // If a replacement is not defined, assume the object exists on the
    // Highcharts namespace.
    const filename = path.split(/[\/\.]/g).at(-2);
    if (typeof replacement === 'undefined') {
        replacement = `var ${filename}_default = Highcharts.${filename};`;
    }

    return js.replace(
        regex,
        `$1\n  // File replaced by post-processing in utils\n  ${replacement}\n\n  $2`
    );

}

// Perform static replacements to the code that esbuild generates. Primarily
// this deals with components that are redefined in secondary bundles, so that
// state is lost when the local components are modified.
const replace = js => {

    // File names and replacements. If a replacement is not defined, assume the
    // object exists on the Highcharts namespace. Like the Chart property should
    // be read from Highcharts.Chart.
    const replacements = {
        'Core/Globals.ts': 'var Globals_default = Highcharts;',

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
        'Core/Time.ts': undefined,
        'Core/Templating.ts': undefined,

        // These ones are called internally from dependencies of the primary
        // bundles and are not needed in secondary bundles
        'Core/Axis/AxisDefaults.ts': '',
        'Core/Chart/ChartDefaults.ts': '',
        'Core/Color/Palettes.ts': '',
        'Core/Foundation.ts': '',
        'Core/Series/SeriesDefaults.ts': '',
        'Core/Renderer/SVG/SVGLabel.ts': '',
        'Core/Renderer/SVG/Symbols.ts': '',
        'Core/Renderer/SVG/TextBuilder.ts': '',

        'Core/Defaults.ts': 'var Defaults_default = Highcharts;',
        'Core/Renderer/RendererRegistry.ts': `
            var RendererRegistry_default = {
                // Simple override because SVGRenderer is the only renderer now
                getRendererType: () => Highcharts.SVGRenderer
            };
        `,
        'Core/Utilities.ts': 'var Utilities_default = Highcharts;',
        'Series/Column/ColumnSeries.ts':
            'var ColumnSeries_default = Highcharts.seriesTypes.column;'
    };

    for (const [path, replacement] of Object.entries(replacements)) {
        js = replaceFileContent(js, path, replacement);
    }

    return js
        .replace('var Globals;', 'var Globals = Highcharts;')

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
    }).catch((e) => {
        js = `console.error(\`${e}\`);`
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