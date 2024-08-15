import express from 'express';
import * as fs from 'node:fs';
import { join } from 'node:path';

const router = express.Router();

router.get('/', function(req, res) {

	let path = fs.readFileSync(join(import.meta.dirname, '../path.txt'), 'utf-8');

	res.redirect(`/samples/view?path=${path}&mobile=true`);
});

export default router;
