const esbuild = require('esbuild');
const fs = require('fs').promises;
const { highchartsDir } = require('./arguments.js');
const { join } = require('path');


const compile = async (path) => {
    const isMainFile = [
            '/highcharts.src.js',
            '/highmaps.src.js',
            '/highstock.src.js',
            '/highcharts-gantt.src.js'
        ].includes(path),
        outfile = join(highchartsDir, 'code', path);
    await esbuild.build({
        entryPoints: [join(highchartsDir, 'ts/masters', path)],
        bundle: true,
        // format: 'umd',
        outfile: outfile,
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
            ) + `console.info('%cCompiled on demand: ${path}', 'color:green');`
        }
    });

    let file = await fs.readFile(outfile, 'utf-8');

    if (path !== '/highcharts.src.js') {
        file = file
            .replace('var Globals;', 'var Globals = Highcharts;')
            .replace(
                'var defaultOptions = {',
                'var defaultOptions = Highcharts?.defaultOptions || {'
            )
            .replace(
                'var SeriesRegistry_default = SeriesRegistry;',
                `var SeriesRegistry_default = Highcharts?.Series ? {
                    registerSeriesType: Highcharts.Series.registerType,
                    seriesTypes: Highcharts.Series.types
                } : SeriesRegistry;`
            )
            .replace(
                'var Series = class {',
                'var Series = Highcharts?.Series || class {'
            );

        await fs.writeFile(outfile, file);
    }
}


module.exports = {
	compile
};