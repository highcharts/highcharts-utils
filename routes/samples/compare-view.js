const express = require('express');
const router = express.Router();


router.get('/', function(req, res) {
	res.render('samples/compare-view', {
		path: req.query.path,
		compareClass: 'active',
		scripts: [
			'/javascripts/compare-view.js',
			'/javascripts/nav.js'
		]
	});
});

module.exports = router;
