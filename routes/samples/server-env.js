const branchName = require('current-git-branch');
const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {

	res.setHeader('Content-Type', 'application/json');
    res.send({
    	branch: branchName(require('./../../config.json').highchartsDir)
    });
});

module.exports = router;
