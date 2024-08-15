import express from 'express';
import * as path from 'path';

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  	res.sendFile(path.join(__dirname + '/../views/index.html'));
});

export default router;
