const express = require('express');
const fs = require('fs').promises;
const router = express.Router();
const help = require('../../lib/settings-help');
const config = require('../../config.json');
const { join } = require('path');


router.get('/', async (req, res) => {

	const json = await fs.readFile(
		join(__dirname, '../..', 'temp', 'config-user.json'),
		'utf-8'
	);
	const user = json ? JSON.parse(json) : {};

	const options = Object.keys(help).map(key => {

		const type = {
				string: 'text',
				boolean: 'checkbox',
				number: 'number'
			}[typeof config[key]],
			value = user[key] ?? config[key];

		return {
			key,
			help: help[key],
			type,
			value,
			isCheckbox: type === 'checkbox',
			checked: value ? 'checked' : ''
		}
	});
	res.render('samples/settings', {
		preJS: req.session.preJS,
		options
	});
});

module.exports = router;
