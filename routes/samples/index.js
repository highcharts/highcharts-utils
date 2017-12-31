const express = require('express');
const path = require('path');
const router = express.Router();

/* GET samples home page. */
router.get('/', function(req, res, next) {
  	res.sendFile(path.join(__dirname + '/../../views/samples/index.html'));
});

module.exports = router;
