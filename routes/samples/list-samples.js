
const express = require('express');
const router = express.Router();
const f = require('./../../lib/functions.js');
const fs = require('fs');
const { join } = require('path');

const highchartsDir = require('./../../config.json').highchartsDir;
const samplesDir = join(highchartsDir, 'samples');


const getSample = (path) => {
	let sample = {
		path: path,
		details: f.getDetails(path),
		files: {}
	};
	
	// Get extra files
	[
		'demo.css',
		'unit-tests.js',
		'test.js',
		'test-notes.html'

	].forEach(extraFile => {
		let filePath = join(samplesDir, path, extraFile);
		if (fs.existsSync(filePath)) {
			sample.files[extraFile] = true;
		}
	});

	return sample;
};

const getSamples = () => {
	let samples = [];
	[
		'highcharts', 'stock', 'maps', 'gantt', 'unit-tests', 'issues', 'cloud'
	].forEach(group => {
		const groupDir = join(samplesDir, group);
		if (fs.existsSync(groupDir) && fs.lstatSync(groupDir).isDirectory()) {
			fs.readdirSync(groupDir).forEach(subgroup => {
				const subgroupDir = join(groupDir, subgroup);
				if (fs.lstatSync(subgroupDir).isDirectory()) {
					fs.readdirSync(subgroupDir).forEach(sample => {
						let path = join(subgroupDir, sample);
						if (
							fs.lstatSync(path).isDirectory() &&
							fs.existsSync(join(path, 'demo.html'))
						) {
							samples.push(getSample(path));
						}
					});
				}
			});
		}
	});
	return JSON.stringify(samples, null, '  ');
};

router.get('/', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
  	res.send(getSamples());
});

module.exports = router;