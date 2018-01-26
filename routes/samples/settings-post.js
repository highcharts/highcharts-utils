const express = require('express');
const router = express.Router();

router.post('/', function(req, res) {
	req.session.preJS = req.body.preJS;
	res.redirect(req.header('Referer'));
});

module.exports = router;
