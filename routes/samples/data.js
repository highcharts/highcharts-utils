const express = require('express');
const router = express.Router();
const fs = require('fs');
const cfg = require('../../config.json');
const path = require('path');

router.get(/[a-z\/\-\.]+\.(js|json|csv)$/, function(req, res) {
	let file = path.join(
		__dirname,
		'../..',
		cfg.highchartsDir,
		'samples/data',
		req.path
	);
	if (!fs.existsSync(file)) {
		res.status(404).send(`File not found: ${file}`);
		return;
    }

    if (/json$/.test(req.path)) {
    	res.setHeader('Content-Type', 'application/json');
    }
	res.sendFile(file);
});

module.exports = router;
