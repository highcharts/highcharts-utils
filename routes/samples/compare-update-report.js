import express from 'express';
import path from 'path';
import fs from 'fs';
import * as f from '../../lib/functions.js';

const router = express.Router();

router.get('/', function(req, res) {
	try {
		let filepath = path.join(
			f.dirname(import.meta),
			'../../temp/compare.' +	f.getBranch().replace('/', '-') + '.' +
			req.query.browser + '.json'
		);
		let json = {};
		let fileExisted = false;

		if (fs.existsSync(filepath)) {
			json = f.getLocalJSON(filepath);
			fileExisted = true;
		}

		json[req.query.path] = req.query.compare;

		fs.writeFileSync(
			filepath,
			JSON.stringify(json, null, '\t'),
			'utf8'
		);

		if (!fileExisted) {
			fs.chmodSync(filepath, '775');
		}

		res.status(204).send();

	} catch (e) {
		res.status(500).send('Error in compare-update-report.js. ' + e);
	}
});

export default router;
