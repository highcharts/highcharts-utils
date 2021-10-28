/**
 * View a single sample.
 *
 * @todo
 * - Styled mode
 */

const express = require('express');
const router = express.Router();
const f = require('./../../lib/functions.js');
const fs = require('fs');
const ip = require('ip');
const { join } = require('path');

router.get('/', async (req, res) => {
	let resources = f.getResources(req.query.path);

	let codePath = req.query.rightcommit ?
		'https://github.highcharts.com/' + req.query.rightcommit :
		'/code';
	fs.writeFile(join(__dirname, '../../path.txt'), req.query.path, 'utf-8', (err) => {
		if (err) {
			console.log(err);
		}
	});

	const es6Context = {};
	const js = f.getJS(req.query.path, req, codePath, es6Context);

	const styledMode = js.indexOf('styledMode: true') !== -1;

	const themes = await f.getThemes(req);

	let tpl = {
		title: req.query.path,
		path: req.query.path,
		mobile: req.query.mobile,
		html: f.getHTML(req, codePath),
		css: f.getCSS(req.query.path, codePath),
		js,
        es6Context,
		preJS: req.session.preJS,
		consoleClear: true,
		bodyClass: req.query.mobile ? 'mobile' : '',
		ipAddress: ip.address(),
		branch: f.getBranch(),
		latestCommit: f.getLatestCommit(),
		scripts: [
			'/javascripts/vendor/jquery-1.11.1.js',
			'/javascripts/view.js',
			'/javascripts/nav.js'
		].concat(resources.scripts),
		styles: [
			'/stylesheets/vendor/font-awesome-4.7.0/css/font-awesome.css'
		].concat(resources.styles),
		readme: f.getReadme(req.query.path),
		testNotes: f.getTestNotes(req.query.path),
		themes,
		rewriteSamplesToES6Checked: req.session.rewriteSamplesToES6 ?
			'checked' : '',
		styledMode
	};

	res.render('samples/view', tpl);
});

module.exports = router;
