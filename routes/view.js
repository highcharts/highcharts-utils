const express = require('express');
const fs = require('fs');
const router = express.Router();
const cfg = require('../config.json');

const getHTML = (path) => {
	let html =
		fs.readFileSync(
			`${cfg.highchartsDir}samples/${path}/demo.html`
		)
		.toString()
		.replace(
			/https:\/\/code\.highcharts\.com\//g,
			'http://code.highcharts.local/'
		);

	if (html.indexOf('/code.highcharts.local/mapdata') !== -1) {
		html = html.replace(
			/\/code\.highcharts\.local\/mapdata/g, 
			'/code.highcharts.com/mapdata'
		);
	}

	// Old IE
	html += `
	<!--[if lt IE 9]>
	<script src='http://code.highcharts.local/modules/oldie.js'></script>
	<![endif]-->
	`;

	// Fore no-cache
	html = html
		.replace(/\.js"/g, '.js?' + Date.now() + '"')
		.replace(/\.css"/g, '.css?' + Date.now() + '"');

	return html;
}

const getCSS = (path) => {
	const cssFile = `${cfg.highchartsDir}samples/${path}/demo.css`;
	let css = '';

	if (fs.existsSync(cssFile)) {
		css =
			fs.readFileSync(cssFile)
			.toString()
			.replace(
				/https:\/\/code\.highcharts\.com\//g,
				'http://code.highcharts.local/'
			);
	}
	return css;
}

const getJS = (path) => {
	let js = fs.readFileSync(
		`${cfg.highchartsDir}samples/${path}/demo.js`
	)

	return js;
}

router.get('/', function(req, res, next) {
	res.render('view', {
		title: 'Sample viewer - Highcharts',
		path: req.query.path,
		html: getHTML(req.query.path),
		css: getCSS(req.query.path),
		js: getJS(req.query.path),
		scripts: [
			'/javascripts/view.js'
		],
		themes: {
			'': 'Default theme',
			'sand-signika': 'Sand Signika',
			'dark-unica': 'Dark Unica',
			'grid-light': 'Grid Light'
		},
		styled: false // @todo: implement
	});
});

module.exports = router;
