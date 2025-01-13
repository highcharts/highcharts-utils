import express from 'express';
import path from 'path';
import { dirname } from '../../lib/functions.js';

const router = express.Router();

router.get('/', function(req, res) {
  	res.sendFile(
		path.join(dirname(import.meta) + '/../../views/bisect/index.html')
	);
});

export default router;
