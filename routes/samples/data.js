const express = require('express');
const router = express.Router();
const fs = require('fs');
const { samplesDir } = require('../../lib/arguments.js');
const { join } = require('path');

router.get(/[a-z\/\-\.]+\.(js|json|csv)$/, function(req, res) {
	let file = join(samplesDir, 'data', req.path);
	if (!fs.existsSync(file)) {
		res.status(404).send(`File not found: ${file}`);
		return;
    }

    if (/json$/.test(req.path)) {
    	res.setHeader('Content-Type', 'application/json');
    }
    res.setHeader('Cache-Control', 'public, max-age=60');
	res.sendFile(file);
});

module.exports = router;
