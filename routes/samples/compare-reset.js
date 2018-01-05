const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const glob = require('glob');

router.get('/', function(req, res) {
	glob(path.join(
		__dirname,
		'../../public/temp/*.json'
	), null, (err, files) => {

		if (err) {
			res.status(500).send(err);
		}

		files.forEach(file => fs.unlinkSync(file));
		
		res.send('window.parent.parent.location.reload()');	
	})
});

module.exports = router;
