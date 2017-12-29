
const express = require('express');
const router = express.Router();
const browser = require('browser-detect');
const branchName = require('current-git-branch');
const fs = require('fs');
const yaml = require('js-yaml');

const highchartsDir = require('./../config.json').highchartsDir;
const samplesDir = `${highchartsDir}samples/`;


const getSample = (path) => {
	let sample = {
		path: path,
		details: {},
		files: {}
	};

	// Get demo.details
	let detailsFile = samplesDir + path + '/demo.details';
	if (fs.existsSync(detailsFile)) {
		let details = fs.readFileSync(detailsFile, 'utf8');
		if (details) {
			sample.details = yaml.load(details);
		}
	}
	
	// Get extra files
	[
		'demo.css',
		'unit-tests.js',
		'test.js',
		'test-notes.html'

	].forEach(extraFile => {
		let filePath = `${samplesDir}/${path}/${extraFile}`;
		if (fs.existsSync(filePath)) {
			sample.files[extraFile] = true;
		}
	});

	return sample;
};

const getSamples = () => {
	let samples = [];
	[
		'highcharts', 'stock', 'maps', 'unit-tests', 'issues', 'cloud'
	].forEach(group => {
		if (fs.lstatSync(samplesDir + group).isDirectory()) {
			fs.readdirSync(samplesDir + group).forEach(subgroup => {
				if (fs.lstatSync(samplesDir + group + '/' + subgroup)
					.isDirectory()
				) {
					fs.readdirSync(
						samplesDir + group + '/' + subgroup
					).forEach(sample => {
						let path = `${group}/${subgroup}/${sample}`;
						if (fs.lstatSync(
							samplesDir + path
						).isDirectory()) {
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