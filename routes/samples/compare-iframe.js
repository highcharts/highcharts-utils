/**
 * Runs in an iframe, comparing candidate and reference.
 */

const express = require('express');
const f = require('./../../lib/functions.js');
const fs = require('fs');
const router = express.Router();
const cfg = require('../../config.json');

const getHTML = (req, codePath) => {
	let html = f.getHTML(req, codePath);

	// If the export module is not loaded, add it so we can run compare
	if (html && html.indexOf('exporting.js') === -1) {
		let exporting = codePath ?
			`${codePath}/modules/exporting.js` :
			'https://code.highcharts.com/modules/exporting.js'
		html += `
		<script src="${exporting}"></script>
		`;
	}
	return html;
}

router.get('/', function(req, res) {
	let path = req.query.path;
	let which = req.query.which;
	let resources = f.getResources(req.query.path);
	let codePath = which === 'right' ? '/code' : '/reference';

	if (req.query.rightcommit && which === 'right') {
		codePath = 'https://github.highcharts.com/' + req.query.rightcommit;
	}

	let tpl = {
		html: getHTML(req, codePath),
		css: f.getCSS(path, codePath),
		js: f.getJS(path),
		scripts: [
			'/javascripts/vendor/jquery-1.9.1.js',
			'/javascripts/compare-iframe.js',
			'/javascripts/test-controller.js'
		].concat(resources.scripts),
		styles: resources.styles,
		path: path,
		which: which
	};

	// Add-hoc unit tests in visual samples. Bad practice, should be undone.
	let unitTestsFile =
		cfg.highchartsDir + 'samples/' + path + '/unit-tests.js';
	if (fs.existsSync(unitTestsFile)) {
		tpl.scripts.push(
			'/javascripts/vendor/qunit-2.0.1.js'
		);
		tpl.styles.push(
			'/stylesheets/vendor/qunit-2.0.1.css'
		);
		tpl.unitTestsFile = fs.readFileSync(unitTestsFile);
	}

	// Add test.js
	let testFile = cfg.highchartsDir + 'samples/' + path + '/tests.js';
	if (fs.existsSync(testFile)) {
		tpl.testFile = fs.readFileSync(testFile);
	}


	res.render('samples/compare-iframe', tpl);
});

module.exports = router;
