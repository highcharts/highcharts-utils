const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
	res.render('samples/mobile', {
		title: 'Highcharts Samples - Mobile',
		scripts: [
			'/javascripts/vendor/jquery-1.11.1.js',
			'/javascripts/mobile.js'
		]
	});
});

module.exports = router;
