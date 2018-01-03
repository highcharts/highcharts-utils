const express = require('express');
const fs = require('fs');
const router = express.Router();
const cfg = require('../../config.json');


router.get('/', function(req, res, next) {
	res.render('samples/compare-view', {
		path: req.query.path,
		compareClass: 'active',
		scripts: [
			'http://ejohn.org/files/jsdiff.js',
			'https://rawgit.com/gabelerner/canvg/v1.4/rgbcolor.js',
			'https://rawgit.com/gabelerner/canvg/v1.4/canvg.js',
			'/javascripts/compare-view.js',
			'/javascripts/nav.js'
		]
	});
});

module.exports = router;
