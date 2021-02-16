/*
Add a bookmarklet to transform a Highcharts sample into ESM format

https://jsfiddle.net/highcharts/tmjo3keu/
*/

const modifyHTML = (html) => {

    html = html
        .replace(/<script /g, '<!--script ')
        .replace(/<\/script>/g, '</script-->');

    html = `<!--
Start TypeScript compiler with watch:
npx tsc -b ts --watch
-->
${html}`;

    return html;
}


const modifyJS = (js) => {

    js = `(async () => {
const Highcharts = await loadHighcharts();

${js}

})();


async function loadHighcharts() {
// Load the files
const location = 'https://code.highcharts.local/es-modules/masters';
const modules = [
    'modules/exporting.src.js'
];

const { default: Highcharts } = await import(\`\${location}/highcharts.src.js\`)
    .catch(console.error);

for (const module of modules) {
    await import(\`\${location}/\${module}\`).catch(console.error);
}
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