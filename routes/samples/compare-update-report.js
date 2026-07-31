import express from 'express';
import path from 'path';
import fs from 'fs';
import * as f from '../../lib/functions.js';

const router = express.Router();

router.post('/', function(req, res) {
	try {
		const config = req.body || {};
		let filepath = path.join(
			f.dirname(import.meta),
			'../../temp/compare.' +	f.getBranch().replace('/', '-') + '.' +
			config.browser + '.json'
		);
		let json = {};
		let fileExisted = false;

		if (fs.existsSync(filepath)) {
			json = f.getLocalJSON(filepath);
			fileExisted = true;
		}

		json[config.path] = config.compare;

		fs.writeFileSync(
			filepath,
			JSON.stringify(json, null, '\t'),
			'utf8'
		);

		if (!fileExisted) {
			fs.chmodSync(filepath, '775');
		}

		res.status(204).send();

	} catch (e) {
		res.status(500).send('Error in compare-update-report.js. ' + e);
	}
});

export default router;
