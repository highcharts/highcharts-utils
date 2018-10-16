const express = require('express');
const f = require('../../lib/functions.js');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const ip = require('ip');

const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'MSIE'];




router.get('/', function(req, res) {
	let compare = {};
	browsers.forEach(browser => {
		const file = path.join(
			__dirname,
			'../..',
			'temp',
			'compare.' + f.getBranch() + '.' + browser.toLowerCase() + '.json'
		);
		
		if (fs.existsSync(file)) {
			let results = require(file);
			Object.keys(results).forEach((path, i) => {
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
					compare[path].comment = sample.comment;
				}

				if (i % 20 === 0) {
					compare[path].showHeader = true;
				}
			})
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

module.exports = router;
