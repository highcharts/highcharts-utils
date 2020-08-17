const express = require('express');
const router = express.Router();
const fs = require('fs');
const { samplesDir } = require('../../lib/arguments.js');
const { join } = require('path');

router.get(/[a-z\/\-\.]+\.(mjs|js|json|csv)$/, function(req, res) {
	let file = join(samplesDir, 'data', req.path);
	if (!fs.existsSync(file)) {
		res.status(404).send(`File not found: ${file}`);
		return;
    }
    if (/\.js$/.test(req.path)) {
        res.setHeader('Content-Type', 'text/javascript');
    }
    if (/\.json$/.test(req.path)) {
    	res.setHeader('Content-Type', 'application/json');
    }
    if (/\/es-modules\/|\.mjs$/.test(req.path)) {
        res.setHeader('Content-Type', 'application/javascript+module');
    }
    res.setHeader('Cache-Control', 'public, max-age=60');
	res.sendFile(file);
});

module.exports = router;
