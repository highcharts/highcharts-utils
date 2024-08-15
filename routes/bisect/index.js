import express from 'express';
import * as path from 'node:path';

const router = express.Router();

router.get('/', function(req, res) {
  	res.sendFile(path.join(import.meta.dirname, '/../../views/bisect/index.html'));
});

export default router;
