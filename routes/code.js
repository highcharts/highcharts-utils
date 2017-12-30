const express = require('express');
const router = express.Router();
const path = require('path');
const cfg = require('./../config.json');
const fs = require('fs');

router.get(/[a-z\/\-\.]+\.(js|css)/, function(req, res, next) {
	let file = (cfg.highchartsDir + 'code' + req.path)
		.replace(/\.src\.js$/, '.js')
		.replace(/\.js$/, '.src.js');

	file = path.join(__dirname, '../', file);

	if (fs.existsSync(file)) {
		res.sendFile(file);
	}
});

module.exports = router;
