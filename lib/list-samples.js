const browser = require('browser-detect');
const branchName = require('current-git-branch');
const fs = require('fs');
const yaml = require('js-yaml');

const highchartsDir = './../highcharts/';
const samplesDir = `${highchartsDir}samples/`;


const getSample = (group, subgroup, name) => {
	let sample = {
		group: group,
		subgroup: subgroup,
		path: `${group}/${subgroup}/${name}`,
		details: {}
	};

	// Get demo.details
	let detailsFile = samplesDir + sample.path + '/demo.details';
	if (fs.existsSync(detailsFile)) {
		let details = fs.readFileSync(detailsFile, 'utf8');
		if (details) {
			sample.details = yaml.load(details);
		}
	}

	// isUnitTest
	if (
		sample.details.resources &&
		sample.details.resources.toString().indexOf('qunit') !== -1
	) {
		sample.isUnitTest = true;	
	}
	if (fs.existsSync(samplesDir + sample.path + '/unit-tests.js')) {
		sample.isUnitTest = true;
	}
	

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
						if (fs.lstatSync(
							samplesDir + group + '/' + subgroup + '/' + sample
						).isDirectory()) {
							samples.push(getSample(group, subgroup, sample));
						}
					});
				}
			});
		}
	});
	return JSON.stringify(samples, null, '  ');
};

module.exports = {
	getSamples: getSamples
};