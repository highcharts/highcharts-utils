import express from 'express';
import * as f from './../../lib/functions.js';

const router = express.Router();

router.get('/', function(req, res) {

	res.setHeader('Content-Type', 'application/json');
    res.send({
    	branch: f.getBranch()
    });
});

export default router;
