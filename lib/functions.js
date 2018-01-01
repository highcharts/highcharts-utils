const fs = require('fs');
const yaml = require('js-yaml');

const highchartsDir = require('./../config.json').highchartsDir;
const samplesDir = `${highchartsDir}samples/`;

/**
 * Get demo.details in form of an object
 */
const getDetails = (path) => {
	let details;
	let detailsFile = samplesDir + path + '/demo.details';
	if (fs.existsSync(detailsFile)) {
		details = fs.readFileSync(detailsFile, 'utf8');
		if (details) {
			details = yaml.load(details);
		}
	}
	return details || {};
}

const getHTML = (req, cdn) => {
	let theme = req.session.theme;
	let path = req.query.path;
	let html =
		fs.readFileSync(
			`${highchartsDir}samples/${path}/demo.html`
		)
		.toString();

	if (!cdn) {
		html = html.replace(
			/https:\/\/code\.highcharts\.com\//g,
			'/code/'
		);

		if (html.indexOf('/code/mapdata') !== -1) {
			html = html.replace(
				/\/code\/mapdata/g, 
				'https://code.highcharts.com/mapdata'
			);
		}
		// Theme
		if (theme) {
			html += `
			<script src='/code/themes/${theme}.js'></script>
			`;
		}
	}

	// Old IE
	html += `
	<!--[if lt IE 9]>
	<script src='/code/modules/oldie.js'></script>
	<![endif]-->
	`;


	// Validation
	if (
		html.indexOf('http://code.highcharts.com') !== -1 ||
		html.indexOf('http://www.highcharts.com') !== -1
	) {
		html += `
		<script>
		window.demoError = 'Do not use http in demo.html. Use secure https. ($path)';
		throw window.demoError;
		</script>
		`;
	}

	if (html.indexOf('.src.js') !== -1) {
		html += `
		<script>
		window.demoError = 'Do not use src.js files in demos. Use .js compiled files.';
		throw window.demoError;
		</script>
		`;
	}

	return html;
}


const getCSS = (path) => {
	const cssFile = `${highchartsDir}samples/${path}/demo.css`;
	let css = '';

	if (fs.existsSync(cssFile)) {
		css =
			fs.readFileSync(cssFile)
			.toString()
			.replace(
				/https:\/\/code\.highcharts\.com\//g,
				'/code/'
			);
	}
	return css;
}

const getJS = (path) => {
	let js = fs.readFileSync(
		`${highchartsDir}samples/${path}/demo.js`
	)

	return js;
}

const getResources = (path) => {
	let details = getDetails(path);
	let resources = {
		scripts: [],
		styles: []
	}
	if (details.resources) {
		details.resources.forEach((file) => {
			if (/\.js$/.test(file)) {
				resources.scripts.push(file);
			} else if (/\.css$/.test(file)) {
				resources.styles.push(file);
			}
		})
	}
	return resources;
}

module.exports = {
	getDetails: getDetails,
	getHTML: getHTML,
	getCSS: getCSS,
	getJS: getJS,
	getResources: getResources
};