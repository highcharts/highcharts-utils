import express from 'express';
import * as f from './../../lib/functions.js';

const router = express.Router();

router.get('/', async function(req, res) {
	const themes = await f.getThemes(req);
    const config = await f.getConfig();

	const colorScheme = config.find(
        option => option.key === 'colorScheme'
    ).value;

	res.render('samples/compare-view', {
		path: req.query.path,
		bodyClass: `highcharts-${colorScheme}`,
		compareClass: 'active',
		consoleClear: true,
		styles: [
			'/stylesheets/vendor/font-awesome-4.7.0/css/font-awesome.css'
		],
		scripts: [
			'/javascripts/vendor/jquery-1.11.1.js',
			'/javascripts/compare-view.js',
			'/javascripts/nav.js'
		],
		themes,
        compileOnDemand: config.find(option => option.key === 'compileOnDemand'),
		colorScheme: {
            light: colorScheme === 'light',
            dark: colorScheme === 'dark',
            system: colorScheme === 'system'
        }
	});
});

export default router;
