const express = require('express');
const router = express.Router();
const f = require('./../../lib/functions.js');

router.get('/', function(req, res, next) {

	res.setHeader('Content-Type', 'application/json');
    res.send({
    	branch: f.getBranch()
    });
});

module.exports = router;
