const express = require('express');
const router = express.Router();
const help = require('../../lib/settings-help');
const config = require('../../config.json');

router.get('/', function(req, res) {

	const options = Object.keys(help).map(key => {

		const type = {
				string: 'text',
				boolean: 'checkbox',
				number: 'number'
			}[typeof config[key]],
			value = req.session[key] ?? config[key];

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
