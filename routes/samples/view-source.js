const express = require('express');
const fs = require('fs');
const router = express.Router();
const cfg = require('../../config.json');
const f = require('./../../lib/functions.js');
const path = require('path');

router.get('/', function(req, res, next) {
	let html = path.join(
		cfg.highchartsDir,
		'samples',
		req.query.path,
		'demo.html'
	);
	let css = path.join(
		cfg.highchartsDir,
		'samples',
		req.query.path,
		'demo.css'
	);
	let js = path.join(
		cfg.highchartsDir,
		'samples',
		req.query.path,
		'demo.js'
	);

	res.render('samples/view-source', {
		scripts: [
			'//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/codemirror.min.js',
			'//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/mode/javascript/javascript.min.js',
			'//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/mode/xml/xml.min.js',
			'//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/mode/htmlmixed/htmlmixed.min.js',
			'//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/mode/css/css.min.js'
		],
		styles: [
			'//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/codemirror.min.css'
		],
		html: fs.existsSync(html) && fs.readFileSync(html),
		css: fs.existsSync(css) && fs.readFileSync(css),
		js: fs.existsSync(js) && fs.readFileSync(js)
	});
});

module.exports = router;
