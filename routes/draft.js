import express from 'express';
import fs from 'fs';
import { join } from 'path';
import { dirname } from '../lib/functions.js';

const router = express.Router();

router.get('/', function(req, res) {

	let path = fs.readFileSync(
		join(dirname(import.meta), '../path.txt'),
		'utf-8'
	);

	res.redirect(`/samples/view?path=${path}&mobile=true`);
});

export default router;
