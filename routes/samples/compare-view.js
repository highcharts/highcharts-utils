const express = require('express');
const router = express.Router();


router.get('/', function(req, res) {
	res.render('samples/compare-view', {
		path: req.query.path,
		compareClass: 'active',
		consoleClear: true,
		styles: [
			'/stylesheets/vendor/font-awesome-4.7.0/css/font-awesome.css'
		],
		scripts: [
			'/javascripts/vendor/jquery-1.11.1.js',
			'/javascripts/compare-view.js',
			'/javascripts/nav.js'
		]
	});
});

module.exports = router;
