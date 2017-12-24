const fs = require('fs');
const yaml = require('js-yaml');

const relPath = './../highcharts/samples/';


const getSample = (group, subgroup, name) => {
	let sample = {
		group: group,
		subgroup: subgroup,
		path: `${group}/${subgroup}/${name}`,
		details: {}
	};

	// Get demo.details
	let detailsFile = relPath + sample.path + '/demo.details';
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
	if (fs.existsSync(relPath + sample.path + '/unit-tests.js')) {
		sample.isUnitTest = true;
	}
	

	return sample;
};

const getSamples = () => {
	let samples = [];
	[
		'highcharts', 'stock', 'maps', 'unit-tests', 'issues', 'cloud'
	].forEach(group => {
		if (fs.lstatSync(relPath + group).isDirectory()) {
			fs.readdirSync(relPath + group).forEach(subgroup => {
				if (fs.lstatSync(relPath + group + '/' + subgroup)
					.isDirectory()
				) {
					fs.readdirSync(
						relPath + group + '/' + subgroup
					).forEach(sample => {
						if (fs.lstatSync(
							relPath + group + '/' + subgroup + '/' + sample
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