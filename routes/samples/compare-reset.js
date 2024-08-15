import express from 'express';
import * as fs from 'node:fs';
import * as path from 'node:path';
import glob from 'glob';

const router = express.Router();

router.get('/', function(req, res) {
	glob(path.join(
		import.meta.dirname,
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
