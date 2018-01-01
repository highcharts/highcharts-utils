const express = require('express');
const f = require('./../../lib/functions.js');
const fs = require('fs');
const router = express.Router();

const getHTML = (req, cdn) => {
	let html = f.getHTML(req, cdn);

	// If the export module is not loaded, add it so we can run compare
	if (html && html.indexOf('exporting.js') === -1) {
		let exporting = cdn ?
			'https://code.highcharts.com/modules/exporting.js' : 
			'/code/modules/exporting.js';
		html += `
		<script src="${exporting}"></script>
		`;
	}
	return html;
}

router.get('/', function(req, res, next) {
	let path = req.query.path;
	let which = req.query.which;
	let resources = f.getResources(req.query.path);
	res.render('samples/compare-iframe', {
		html: getHTML(req, which === 'right'),
		css: f.getCSS(path),
		js: f.getJS(path),
		scripts: [
			'/javascripts/compare-iframe.js'
		].concat(resources.scripts),
		styles: resources.styles,
		path: path,
		which: which
	});
});

module.exports = router;
