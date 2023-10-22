const express = require('express');
const fs = require('fs').promises;
const { join } = require('path');
const router = express.Router();
const config = require('../../config.json');

router.post('/', async (req, res) => {

	// Overwrite config-user.json with only those settings that have changed
	const user = {};
	Object.keys(config).forEach(key => {
		let value = req.body[key];

		if (typeof config[key] === 'boolean') {
			value = req.body[key] === 'on';
		} else if (typeof config[key] === 'number') {
			value = parseInt(req.body[key], 10);
		}

		if (value != config[key]) {
			user[key] = value;
		}
	});

	await fs.writeFile(
		join(__dirname, '../../temp', 'config-user.json'),
		JSON.stringify(user, null, '  '),
		'utf-8'
	);

	req.session.preJS = req.body.preJS;
	req.session.theme = req.body.theme;

	res.redirect(req.header('Referer'));
});

module.exports = router;
