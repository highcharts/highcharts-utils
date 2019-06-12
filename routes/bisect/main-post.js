const express = require('express');
const router = express.Router();


router.post('/', function(req, res) {
	req.session.html = req.body.html;
	req.session.css = req.body.css;
	req.session.js = req.body.js;
	res.redirect('/bisect/main');
});

module.exports = router;
