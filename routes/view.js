const express = require('express');
const fs = require('fs');
const router = express.Router();
const cfg = require('../config.json');

const getHTML = (req) => {
	let theme = req.session.theme;
	let path = req.query.path;
	let html =
		fs.readFileSync(
			`${cfg.highchartsDir}samples/${path}/demo.html`
		)
		.toString()
		.replace(
			/https:\/\/code\.highcharts\.com\//g,
			'/code/'
		);

	if (html.indexOf('/code/mapdata') !== -1) {
		html = html.replace(
			/\/code\/mapdata/g, 
			'https://code.highcharts.com/mapdata'
		);
	}

	// Old IE
	html += `
	<!--[if lt IE 9]>
	<script src='/code/modules/oldie.js'></script>
	<![endif]-->
	`;

	// Theme
	if (theme) {
		html += `
		<script src='/code/themes/${theme}.js'></script>
		`;
	}
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
				'/code/'
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
	let tpl = {
		title: 'Sample viewer - Highcharts',
		path: req.query.path,
		html: getHTML(req),
		css: getCSS(req.query.path),
		js: getJS(req.query.path),
		scripts: [
			'/javascripts/view.js'
		],
		themes: {
			'': {
				name: 'Default theme'
			},
			'sand-signika': {
				name: 'Sand Signika',
				selected: req.session.theme === 'sand-signika' && 'selected'
			},
			'dark-unica': {
				name: 'Dark Unica',
				selected: req.session.theme === 'dark-unica' && 'selected'
			},
			'grid-light': {
				name: 'Grid Light',
				selected: req.session.theme === 'grid-light' && 'selected'
			}
		},
		styled: false // @todo: implement
	};

	res.render('view', tpl);
});

module.exports = router;
