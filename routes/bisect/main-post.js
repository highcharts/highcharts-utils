const express = require('express');
const path = require('path');
const router = express.Router();
const highchartsDir = require('../../config.json').highchartsDir;


router.post('/', function(req, res, next) {
	req.session.html = req.body.html;
	req.session.css = req.body.css;
	req.session.js = req.body.js;
	res.redirect('/bisect/main');
});

module.exports = router;
