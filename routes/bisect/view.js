const express = require('express');
const path = require('path');
const router = express.Router();

const replaceHTML = (html, hash) => {
	return html
		.replace(
			/https?\:\/\/code\.highcharts\.com\//g,
			`http://github.highcharts.com/${hash}/`
		)
		.replace(
			/https?\:\/\/github\.highcharts\.com\/[a-z0-9\.\-]\/mapdata\//g,
			'http://code.highcharts.com/mapdata/'
		);
}

router.get('/', function(req, res, next) {
  	res.render('bisect/view', {
  		html: replaceHTML(req.session.html || '', req.query.hash),
  		css: req.session.css,
  		js: req.session.js,
  		hash: req.query.hash,
  		shortHash: req.query.hash.substring(0, 8)
  	});
});

module.exports = router;
