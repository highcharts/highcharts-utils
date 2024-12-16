import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  	res.sendFile(path.join(__dirname + '/../views/index.html'));
});

export default router;
