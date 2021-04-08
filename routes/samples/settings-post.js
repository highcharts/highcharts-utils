const express = require('express');
const router = express.Router();

router.post('/', function(req, res) {
	req.session.rewriteSamplesToES6 = req.body.rewriteSamplesToES6;
	req.session.preJS = req.body.preJS;
	req.session.theme = req.body.theme;

	res.redirect(req.header('Referer'));
});

module.exports = router;
