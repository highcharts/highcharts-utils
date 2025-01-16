import express from 'express';
import fs from 'fs';
import { marked } from 'marked';
import path from 'path';
import ip from 'ip';
import { dirname } from '../../lib/functions.js';

const router = express.Router();

router.get('/', function(req, res) {
	res.render('samples/readme', {
		readme: marked.parse(
			fs.readFileSync(
				path.join(dirname(import.meta), '../../lib/readme.md')
			).toString()
		),
		ipAddress: ip.address()
	});
});

export default router;
