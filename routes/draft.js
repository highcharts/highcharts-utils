import express from 'express';
import fs from 'fs';
import { join } from 'path';

const router = express.Router();

router.get('/', function(req, res) {

	let path = fs.readFileSync(join(__dirname, '../path.txt'), 'utf-8');

	res.redirect(`/samples/view?path=${path}&mobile=true`);
});

export default router;
