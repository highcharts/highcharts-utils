const express = require('express');
const fs = require('fs');
const router = express.Router();
const path = require('path');
const { samplesDir } = require('../../lib/arguments.js');

router.get('/', function(req, res) {
	let html = path.join(
		samplesDir,
		req.query.path,
		'demo.html'
	);
	let css = path.join(
		samplesDir,
		req.query.path,
		'demo.css'
	);
	let js = path.join(
		samplesDir,
		req.query.path,
		'demo.js'
	);

  let mjs = path.join(
    samplesDir,
    req.query.path,
    'demo.mjs'
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
    js: fs.existsSync(js) ? fs.readFileSync(js) : (fs.existsSync(mjs) && fs.readFileSync(mjs)) 
	});
});

module.exports = router;
