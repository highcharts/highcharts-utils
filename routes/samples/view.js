/**
 * View a single sample.
 *
 * @todo
 * - Styled mode
 */

const express = require('express');
const router = express.Router();
const f = require('./../../lib/functions.js');

router.get('/', function(req, res) {
	let resources = f.getResources(req.query.path);

	let codePath = req.query.rightcommit ?
		'https://github.highcharts.com/' + req.query.rightcommit :
		'/code';

	let tpl = {
		title: req.query.path,
		path: req.query.path,
		html: f.getHTML(req, codePath),
		css: f.getCSS(req.query.path, codePath),
		js: f.getJS(req.query.path),
		preJS: req.session.preJS,
		consoleClear: true,
		scripts: [
			'/javascripts/vendor/jquery-1.11.1.js',
			'/javascripts/view.js',
			'/javascripts/nav.js'
		].concat(resources.scripts),
		styles: resources.styles,
		readme: f.getReadme(req.query.path),
		testNotes: f.getTestNotes(req.query.path),
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

	res.render('samples/view', tpl);
});

module.exports = router;
