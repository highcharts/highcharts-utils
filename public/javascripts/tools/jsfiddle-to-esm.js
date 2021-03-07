/*
Add a bookmarklet to transform a Highcharts sample into ESM format

https://jsfiddle.net/highcharts/tmjo3keu/
*/

(function () {
    const scripts = [];

    const modifyHTML = (html) => {

        const doc = new DOMParser().parseFromString(html, 'text/html');

        [...doc.querySelectorAll('script')]
            .forEach(script => {
                if (/code\.highcharts\.(com|local)/.test(script.src)) {
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


    const modifyJS = (js) => {

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
            const location = 'https://code.highcharts.local/es-modules/masters';
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

    const applyESM = () => {

        document.querySelectorAll('.CodeMirror')[0].CodeMirror.setValue(
            modifyHTML(
                document.querySelectorAll('.CodeMirror')[0].CodeMirror.getValue()
            )
        );


        document.querySelectorAll('.CodeMirror')[1].CodeMirror.setValue(
            modifyJS(
                document.querySelectorAll('.CodeMirror')[1].CodeMirror.getValue()
            )
        );


        [...document.querySelectorAll('a.panelTidy')].forEach(a => a.click());
    };

    applyESM();
})();