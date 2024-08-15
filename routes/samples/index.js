import express from 'express';
import * as path from 'node:path';

const router = express.Router();

/* GET samples home page. */
router.get('/', function(req, res, next) {
  	res.sendFile(path.join(__dirname + '/../../views/samples/index.html'));
});

export default router;
