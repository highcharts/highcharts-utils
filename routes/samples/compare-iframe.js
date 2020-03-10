/**
 * Runs in an iframe, comparing candidate and reference.
 */

const express = require('express');
const f = require('./../../lib/functions.js');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const router = express.Router();
const { emulateKarma, samplesDir } = require('../../lib/arguments.js');
const { join } = require('path');

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

const getJS = (path, req) => {

	let js = f.getJS(path, req);

	if (path.indexOf('unit-tests/') !== 0) {

		// Don't do intervals (typically for gauge samples, add point etc)
		js = js.replace('setInterval', 'Highcharts.noop');

		// Force enableSimulation: false
		js = js.replace('enableSimulation: true','enableSimulation: false');

		js = js.replace('animation:','_animation:');
	}

	return js;
}

const getTemplates = () => {
	return glob.sync(
		path.join(
			__dirname,
			'../..',
			'public/javascripts/test-templates/**/*.js'
		)
	).map(filename => '/' + filename.split('/public/')[1]);
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
		html: emulateKarma ?
			f.getKarmaHTML() :
			getHTML(req, codePath),
		css: f.getCSS(path, codePath),
		js: getJS(path, req),
		scripts: [
			'/javascripts/vendor/jquery-1.11.1.js',
			'/javascripts/vendor/lolex.js',
			'/javascripts/compare-iframe.js',
			'/javascripts/test-controller.js',
			'/javascripts/test-utilities.js'
		].concat(resources.scripts),
		deferredScripts: [
			'/javascripts/test-template.js'
		].concat(getTemplates()),
		styles: resources.styles,
		path: path,
		which: which
	};

	// Add-hoc unit tests in visual samples. Bad practice, should be undone.
	let unitTestsFile =
		join(samplesDir, path, 'unit-tests.js');
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
	let testFile = join(samplesDir, path, 'tests.js');
	if (fs.existsSync(testFile)) {
		tpl.testFile = fs.readFileSync(testFile);
	}


	res.render('samples/compare-iframe', tpl);
});

module.exports = router;
