import express from 'express';
import { promises as fs } from 'fs';
import { join } from 'path';
import config from '../../config.json' with { type: 'json' };
import { dirname } from '../../lib/functions.js';

const router = express.Router();

router.post('/', async (req, res) => {
	const configUserPath = join(
		dirname(import.meta),
		'../../temp',
		'config-user.json'
	);

	const userJSON = await fs.readFile(
        configUserPath,
        'utf-8'
    );
    const configUser = userJSON ? JSON.parse(userJSON) : {};

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

export default router;
