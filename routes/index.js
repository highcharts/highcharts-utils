import express from 'express';
import * as path from 'path';

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  	res.sendFile(path.join(import.meta.dirname, '/../views/index.html'));
});

export default router;
