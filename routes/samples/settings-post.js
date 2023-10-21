const express = require('express');
const router = express.Router();
const config = require('../../config.json');

router.post('/', function(req, res) {

	Object.keys(config).forEach(key => {
		req.session[key] = req.body[key] === 'on' ?
			true :
			req.body[key] ?? config[key];
	});

	req.session.preJS = req.body.preJS;
	req.session.theme = req.body.theme;

	res.redirect(req.header('Referer'));
});

module.exports = router;
