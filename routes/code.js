const express = require('express');
const router = express.Router();
const f = require('../lib/functions');

router.get(/[a-z\/\-\.]+\.(js|css)/, function(req, res) {
	let file = f.getCodeFile(req.path);

	if (file.error) {
		res.status(404).end(file.error);
		return;
	}

	// res.setHeader('Cache-Control', 'public, max-age=60');
	res.sendFile(file.success);
});

module.exports = router;
