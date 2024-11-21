import express from 'express';
import * as fs from 'node:fs';
import ip from 'ip';
import * as marked from 'marked';
import * as path from 'node:path';

const router = express.Router();


router.get('/', function(req, res) {
	res.render('samples/readme', {
		readme: marked.parse(
			fs.readFileSync(path.join(import.meta.dirname, '../../lib/readme.md'))
				.toString()
		),
		ipAddress: ip.address()
	});
});

export default router;
