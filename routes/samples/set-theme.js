const branchName = require('current-git-branch');
const express = require('express');
const router = express.Router();

router.post('/', function(req, res, next) {
	req.session.theme = req.body.theme;
	res.redirect(req.header('Referer'));
});

module.exports = router;
