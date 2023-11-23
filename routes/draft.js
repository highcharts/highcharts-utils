const express = require('express');
const router = express.Router();
const fs = require('fs');
const { join } = require('path');

router.get('/', function(req, res) {

	let path = fs.readFileSync(join(__dirname, '../path.txt'), 'utf-8');

	res.redirect(`/samples/view?path=${path}&mobile=true`);
});

module.exports = router;
