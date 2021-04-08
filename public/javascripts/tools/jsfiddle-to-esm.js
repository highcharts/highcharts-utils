/**
 * This is an isomorphic module that converts ES5 type samples to ES6 loading
 * with the purpose of faster development. Instead of running
 * `gulp scripts-watch` we can run `npx tsc -b ts --watch` which is much faster.
 * The module is used in two environments:
 *
 * - In jsFiddle using a bookmarklet: https://jsfiddle.net/highcharts/tmjo3keu/
 * - In the utils app using a switch
 */

const scripts = [];

export const htmlToESM = (html, JSDOM) => {

    let doc;
    if (typeof DOMParser !== 'undefined') {
        doc = new DOMParser().parseFromString(html, 'text/html');
    } else {
        const dom = new JSDOM(html);
        doc = dom.window.document;
    }

    scripts.length = 0;
    [...doc.querySelectorAll('script')]
        .forEach(script => {
            if (
                /code\.highcharts\.(com|local)/.test(script.src) ||
                script.src.indexOf('/') === 0
            ) {
                scripts.push(script.src);
                script.remove();
            }
        });

    return `<!--
Start TypeScript compiler with watch:
npx tsc -b ts --watch
-->` +
    // scripts go into the head
    doc.querySelector('head').innerHTML +
    doc.body.innerHTML

}


export const jsToESM = (
    js,
    server = 'http://code.highcharts.local'
) => {

    let maps = [];
    const mapRegex = /(http|https):\/\/code\.highcharts\.(com|local)\/mapdata\/([a-z\-\/]+)\.js/;

    const files = scripts
        .map(script => {
            const match = script.match(mapRegex);
            if (match) {
                maps.push(match[3]);
                return;
            }
            return script
                .replace(
                    /(http|https):\/\/code\.highcharts\.(com|local)\//,
                    ''
                )
                .replace(/^\/code\//, '')
                .replace(/^stock\//, '')
                .replace(/^maps\//, '')
                .replace(/^gantt\//, '')
                .replace('.src.js', '.js')
                .replace('.js', '.src.js');

        })
        .filter(script => Boolean(script));

    const main = files.shift();
    const modules = JSON.stringify(files, null, '  ')
        .replace(/"/g, "'");

    if (maps.length) {
        maps = JSON.stringify(maps, null, '  ')
            .replace(/"/g, "'");
    } else {
        maps = undefined;
    }

    js = `(async () => {
        const Highcharts = await loadHighcharts();

        ${js}

        })();


        async function loadHighcharts() {
        // Load the files
        const location = '${server}/es-modules/masters';
        const modules = ${modules};

        const { default: Highcharts } = await import(\`\${location}/${main}\`)
            .catch(console.error);

        for (const module of modules) {
            await import(\`\${location}/\${module}\`).catch(console.error);
        }
        `;

    if (maps) {
        js += `
        // Load maps
        const maps = ${maps};
        for (const map of maps) {
            const response = await fetch(
                \`https://code.highcharts.com/mapdata/\${map}.geo.json\`
            );
            Highcharts.maps[map] = await response.json();
        }
        `;
    }



    js += `
        return Highcharts;
        }
    `;

    return js;
}

export const applyESM = () => {

    document.querySelectorAll('.CodeMirror')[0].CodeMirror.setValue(
        htmlToESM(
            document.querySelectorAll('.CodeMirror')[0].CodeMirror.getValue()
        )
    );


    document.querySelectorAll('.CodeMirror')[1].CodeMirror.setValue(
        jsToESM(
            document.querySelectorAll('.CodeMirror')[1].CodeMirror.getValue()
        )
    );


    [...document.querySelectorAll('a.panelTidy')].forEach(a => a.click());
};

