const express = require('express');
const fs = require('fs');
const marked = require('marked');
const router = express.Router();
const path = require('path');
const ip = require('ip');


router.get('/', function(req, res) {
	res.render('samples/readme', {
		readme: marked.parse(
			fs.readFileSync(path.join(__dirname, '../../lib/readme.md'))
				.toString()
		),
		ipAddress: ip.address()
	});
});

module.exports = router;
