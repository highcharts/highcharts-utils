const express = require('express');
const fs = require('fs');
const marked = require('marked');
const router = express.Router();
const path = require('path');


router.get('/', function(req, res, next) {
	res.render('samples/readme', {
		readme: marked(
			fs.readFileSync(path.join(__dirname, '../../lib/readme.md'))
				.toString()
		)
	});
});

module.exports = router;
