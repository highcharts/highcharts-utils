import express from 'express';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { dirname } from '../../lib/functions.js';

const router = express.Router();

router.get('/', async function(req, res) {
	await glob(path.join(
		dirname(import.meta),
		'../../temp/*.json'
	), null, (err, files) => {

		if (err) {
			res.status(500).send(err);
		}

		files.forEach(file => fs.unlinkSync(file));

		res.send('window.parent.parent.location.href = "/samples"');
	})
});

export default router;
