const express = require('express');
const router = express.Router();
const f = require('../lib/functions');

router.get(/[a-z\/\-\.]+\.(js|css)/, function(req, res, next) {
	let file = f.getCodeFile(req.path);

	if (file.error) {
		res.end(file.error);
	}

	res.sendFile(file.success);
});

module.exports = router;
