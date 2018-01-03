const express = require('express');
const path = require('path');
const router = express.Router();
const highchartsDir = require('../../config.json').highchartsDir;
const git = require('simple-git/promise')(highchartsDir);


router.post('/', function(req, res, next) {
	req.session.branch = req.body.branch;
	req.session.after = req.body.after;
	req.session.before = req.body.before;
	req.session.alltags = req.body.alltags === 'on';
	res.redirect('/bisect/commits');
});

module.exports = router;
