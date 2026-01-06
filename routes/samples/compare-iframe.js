/**
 * Runs in an iframe, comparing candidate and reference.
 */

import express from 'express';
import * as f from './../../lib/functions.js';
import { glob } from 'glob';
import path from 'path';
import { getSettings } from '../../lib/arguments.js';

const router = express.Router();

const getHTML = async (req, codePath) => {
	let html = await f.getHTML(req, codePath);

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

const getJS = (req, codePath) => {

	let js = f.getJS(req, codePath);

	if (req.query.path.indexOf('unit-tests/') !== 0) {

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
			f.dirname(import.meta),
			'../..',
			'public/javascripts/test-templates/**/*.js'
		)
	).map(filename => '/' + filename.split('/public/')[1]);
}

export const getTestTemplate = async function(req) {

	const { colorScheme, compileOnDemand, emulateKarma } = getSettings(req);
	let path = req.query.path;
	let which = req.query.which;
	let resources = f.getResources(req.query.path);
	let codePath = which === 'right' ? '/code' : '/reference';

	// Bisecting
	if (req.query.rightcommit && which === 'right') {
		codePath = compileOnDemand ?
			'/code' :
			'https://github.highcharts.com/' + req.query.rightcommit;
	}

	const html = emulateKarma ? f.getKarmaHTML() : await getHTML(req, codePath);

	return {
		title: req.query.path,
		html,
		css: f.getCSS(req, codePath),
		js: getJS(req, codePath),
		scripts: [
			'/javascripts/vendor/jquery-1.11.1.js',
			'/javascripts/vendor/lolex.js',
			'/javascripts/compare-iframe.js',
			'/javascripts/test-controller.js',
			'/javascripts/test-touch.js',
			'/javascripts/test-utilities.js'
		].concat(resources.scripts),
		deferredScripts: [
			'/javascripts/test-template.js'
		].concat(getTemplates()),
		styles: resources.styles,
		path: path,
		which: which,
		bodyClass: `highcharts-${colorScheme}`
	};
};

router.get('/', async (req, res) => {
	const tpl = await getTestTemplate(req);
	res.render('samples/compare-iframe', tpl);
});

export default router;
