const esbuild = require('esbuild');
const { highchartsDir } = require('./arguments.js');
const { join } = require('path');
const replacePlugin = require('esbuild-plugin-replace-regex');
const semver = require('semver');

// Esbuild (0.19.5) crashes on defaulting function arguments to
// this.someThing
const getPlugins = () => {
    const version = require(join(highchartsDir, 'package.json')).version;
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
        })]
    }
    return [];
};

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
const replace = (js, umdConfig) => {

    // File names and replacements. If a replacement is not defined, assume the
    // object exists on the Highcharts namespace. Like the Chart property should
    // be read from Highcharts.Chart.
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
        'Core/Time.ts': undefined,
        'Core/Templating.ts': undefined,
        // 'Extensions/Pane.ts': undefined,

        // These ones are called internally from dependencies of the primary
        // bundles and are not needed in secondary bundles
        // 'Core/Axis/AxisDefaults.ts': '',
        'Core/Chart/ChartDefaults.ts': '',
        'Core/Color/Palettes.ts': '',
        'Core/Foundation.ts': '',
        'Core/Series/SeriesDefaults.ts': '',
        'Core/Renderer/SVG/SVGLabel.ts': '',
        'Core/Renderer/SVG/Symbols.ts': '',
        'Core/Renderer/SVG/TextBuilder.ts': '',

        'Core/Defaults.ts': `var Defaults_default = ${umdConfig.name};`,
        'Core/Renderer/RendererRegistry.ts': `
            var RendererRegistry_default = {
                // Simple override because SVGRenderer is the only renderer now
                getRendererType: () => ${umdConfig.name}.SVGRenderer
            };
        `,
        'Core/Utilities.ts': `var Utilities_default = Highcharts;`,
        'Series/Column/ColumnSeries.ts':
            `var ColumnSeries_default = ${umdConfig.name}.seriesTypes.column;`
    };

    for (const [path, replacement] of Object.entries(replacements)) {
        js = replaceFileContent(js, path, replacement);
    }

    return js
        .replace('var Globals;', `var Globals = ${umdConfig.name};`)

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


const compile = async (path) => {

    const isPrimaryFile = [
            '/dashboards/dashboards.src.js',
            '/highcharts.src.js',
            '/highmaps.src.js',
            '/highstock.src.js',
            '/highcharts-gantt.src.js'
        ].includes(path),
        umdConfig = path.indexOf('/dashboards') === 0 ?
            {
                name: 'Dashboards',
                shortPath: 'dashboards',
                path: 'dashboards/dashboards'
            } : {
                name: 'Highcharts',
                shortPath: 'dashboards',
                path: 'highcharts/highcharts'
            },
        masterPath = `ts/masters${path}`.replace(
            '/masters/dashboards/',
            '/masters-dashboards/'
        ),
        start = Date.now();

    let js;

    const result = await esbuild.build({
        entryPoints: [join(highchartsDir, masterPath)],
        bundle: true,
        write: false,
        globalName: isPrimaryFile ? 'Highcharts' : 'HighchartsModule',
        plugins: getPlugins(),
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
    define('${umdConfig.path}', function () {
        return factory(root);
    });
} else {
    if (root.${umdConfig.name}) {
        root.${umdConfig.name}.error(16, true);
    }
    root.${umdConfig.name} = factory(root);
}
}(typeof window !== 'undefined' ? window : this, function (window) {` :

// UMD header for module files
`(function (factory) {
if (typeof module === 'object' && module.exports) {
    factory['default'] = factory;
    module.exports = factory;
} else if (typeof define === 'function' && define.amd) {
    define('${path}', ['${umdConfig.shortPath}'], function (${umdConfig.name}) {
        factory(${umdConfig.name});
        factory.${umdConfig.name} = ${umdConfig.name};
        return factory;
    });
} else {
    factory(typeof ${umdConfig.name} !== 'undefined' ? ${umdConfig.name} : undefined);
}
}(function (${umdConfig.name}) {
    `
        },
        footer: {
            js: (
                isPrimaryFile ?
                    // Why is the or statement needed? Dashboards has no .default???
                    `return ${umdConfig.name}.default || ${umdConfig.name}; }));` :
                    '}));'
            )
        }
    }).catch((e) => {
        js = `console.error(\`${e}\`);`
    });

    if (result) {
        js = result.outputFiles[0].text;

        if (!isPrimaryFile) {
            js = replace(js, umdConfig);
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