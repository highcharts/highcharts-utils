
const express = require('express');
const router = express.Router();
const f = require('./../../lib/functions.js');
const fs = require('fs');
const { join, relative, sep } = require('path');
const { samplesDir } = require('../../lib/arguments.js');

/**
 * Creates a serializable representation of a sample.
 *
 * @param {string} path An relative path to sample directory
 * @returns {object} Return sample
 */
const getSample = (path) => {
	let sample = {
		// path is a url relative to sample directory
		path,
		details: f.getDetails(path),
		files: {}
	};

	// Get extra files
	[
		'demo.css',
		'test-notes.html'

	].forEach(extraFile => {
		let filePath = join(path, extraFile);
		if (fs.existsSync(filePath)) {
			sample.files[extraFile] = true;
		}
	});

	return sample;
};

const getSamples = () => {
	let samples = [];
	[
		'highcharts', 'stock', 'maps', 'gantt', 'unit-tests', 'issues', 'cloud', 'dashboards', 'data-grid'
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
							const relativePath = relative(samplesDir, path)
								.split(sep).join('/');
							samples.push(getSample(relativePath));
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
