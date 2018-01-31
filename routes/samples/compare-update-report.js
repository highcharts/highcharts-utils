const express = require('express');
const path = require('path');
const router = express.Router();
const fs = require('fs');
const f = require('../../lib/functions.js');

router.get('/', function(req, res) {
	try {
		let fileName = path.join(
			__dirname,
			'../../temp/compare.' +	f.getBranch().replace('/', '-') + '.' +
			req.query.browser + '.json'
		);
		let json = {};
		let fileExisted = false;
		
		if (fs.existsSync(fileName)) {
			json = require(fileName);
			fileExisted = true;
		}

		json[req.query.path] = req.query.compare;
		
		fs.writeFileSync(
			fileName,
			JSON.stringify(json, null, '\t'),
			'utf8'
		);

		if (!fileExisted) {
			fs.chmodSync(fileName, '775');
		}

		res.status(204).send();

	} catch (e) {
		res.status(500).send('Error in compare-update-report.js. ' + e);
	}
});

module.exports = router;
