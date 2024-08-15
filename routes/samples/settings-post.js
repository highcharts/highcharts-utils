const express = await import('express');
const fs = await import('fs').promises;
const { join } = await import('path');
const router = express.Router();
const config = await import('../../config.json');

router.post('/', async (req, res) => {
	const configUserPath = join(__dirname, '../../temp', 'config-user.json'),
		configUser = await import(configUserPath, { with: { type: "json" } });

	// Quick settings
	const onlyInBody = !!req.body['quickSettings'];

	// Overwrite config-user.json with only those settings that have changed
	Object.keys(config).forEach(key => {
		let value = req.body[key];

		if (!onlyInBody || key in req.body) {

			if (typeof config[key] === 'boolean') {
				value = req.body[key] === 'on';
			} else if (typeof config[key] === 'number') {
				value = parseInt(req.body[key], 10);
			}

			if (value != config[key]) {
				configUser[key] = value;
			} else {
				delete configUser[key];
			}
		}
	});

	await fs.writeFile(
		configUserPath,
		JSON.stringify(configUser, null, '  '),
		'utf-8'
	);

	req.session.preJS = req.body.preJS;
	req.session.theme = req.body.theme;

	res.redirect(req.header('Referer'));
});

module.exports = router;
