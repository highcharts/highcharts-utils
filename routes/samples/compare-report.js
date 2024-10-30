import express from 'express';
import {
	getBranch,
	// getNightlyResult
} from '../../lib/functions.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ip from 'ip';

const router = express.Router();

const browsers = ['Nightly', 'Chrome', 'Safari', 'Firefox', 'Edge', 'MSIE'];

router.get('/', async (req, res) => {
	let compare = {};

	// const nightlyResult = JSON.parse(await getNightlyResult(Date.now()));

	browsers.forEach(browser => {
		const file = path.join(
			import.meta.dirname,
			'../..',
			'temp',
			'compare.' + getBranch() + '.' + browser.toLowerCase() + '.json'
		);

		let results;
		if (browser === 'Nightly') {
			// results = nightlyResult;
		} else if (fs.existsSync(file)) {
			results = require(file);
		}

		if (results) {
			let paths = Object.keys(results);
			// Sort paths alphabetically
			paths.sort((a, b) => a.localeCompare(b));

			paths.forEach((path) => {
				let sample = results[path];
				//let range = [sample.diff];
				if (!compare[path]) {
					compare[path] = {
						browsers: {},
						sparkline: []
					};
					browsers.forEach(b => compare[path].browsers[b] = '');
				}

				compare[path].browsers[browser] = sample.diff;

				if (sample.diff !== 'Err' && sample.diff !== 'skip') {
					compare[path].sparkline.push(sample.diff);

					// Show sparkline only when not 0
					if (sample.diff && sample.diff !== '0') {
						compare[path].hasSparkline = true;
					}
				}


				if (sample.comment) {
					if (sample.comment.title && sample.comment.title.indexOf(browser) !== 0) {
						sample.comment.title = `${browser}: ${sample.comment.title}`;
					}
					compare[path].comment = sample.comment;
				}
			})
		}
	});

	// Show headers
	Object.keys(compare).forEach((path, i) => {
		if (i % 20 === 0) {
			compare[path].showHeader = true;
		}
	});

	res.render('samples/compare-report', {
		path: req.query.path,
		browsers: browsers,
		styles: [
			'/stylesheets/vendor/font-awesome-4.7.0/css/font-awesome.css'
		],
		scripts: [
			'/javascripts/vendor/jquery-1.11.1.js',
			'/code/highcharts.js'
		],
		compare: compare,
		ipAddress: ip.address()
	});
});

export default router;
