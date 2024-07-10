const express = require('express');
const fs = require('fs');
const router = express.Router();
const path = require('path');
const { samplesDir } = require('../../lib/arguments.js');

router.get('/', function(req, res) {
  const htmlPath = path.join(
    samplesDir,
    req.query.path,
    'demo.html'
  );
  const cssPath = path.join(
    samplesDir,
    req.query.path,
    'demo.css'
  );
  const jsPath = path.join(
    samplesDir,
    req.query.path,
    'demo.js'
  );

  const mjsPath = path.join(
    samplesDir,
    req.query.path,
    'demo.mjs'
  );

  res.render('samples/edit', {
    scripts: [
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/codemirror.min.js',
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/mode/javascript/javascript.min.js',
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/mode/xml/xml.min.js',
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/mode/htmlmixed/htmlmixed.min.js',
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/mode/css/css.min.js'
    ],
    styles: [
    	'/stylesheets/vendor/font-awesome-4.7.0/css/font-awesome.css',
		  '//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/codemirror.min.css'
    ],
    htmlPath,
    html: fs.existsSync(htmlPath) && fs.readFileSync(htmlPath),
    cssPath,
    css: fs.existsSync(cssPath) && fs.readFileSync(cssPath),
    jsPath,
    js: fs.existsSync(jsPath) ? fs.readFileSync(jsPath) : (fs.existsSync(mjsPath) && fs.readFileSync(mjsPath))
  });
});

module.exports = router;
