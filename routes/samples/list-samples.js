
import express from 'express';
import * as f from './../../lib/functions.js';
import fs from 'fs';
import { join, relative, sep } from 'path';
import { samplesDir } from '../../lib/arguments.js';
import * as demoConfig from './../../../highcharts/samples/demo-config.js';

const router = express.Router();


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
	const samples = [];

	[
		'highcharts',
		'stock',
		'maps',
		'gantt',
		'unit-tests',
		'issues',
		'cloud',
		'dashboards',
		'grid-lite',
		'grid-pro'
	].forEach(group => {
		const groupDir = join(samplesDir, group);
		if (fs.existsSync(groupDir) && fs.lstatSync(groupDir).isDirectory()) {
			const subgroups = fs.readdirSync(groupDir);

			// Move the 'demo' subgroup to the start of the list
			const demoIndex = subgroups.indexOf('demo');
			if (demoIndex > -1) {
				subgroups.unshift(subgroups.splice(demoIndex, 1)[0]);
			}

			const demos = [],
				otherSamples = [];
			subgroups.forEach(subgroup => {
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

							if (subgroup === 'demo') {
								demos.push(getSample(relativePath));
							} else {
								otherSamples.push(getSample(relativePath));
							}
						}
					});
				}
			});

			// Order the demos as they appear in the demo pages
			if (demos.length) {
				const demoConfigGroup = Object.values(demoConfig.default).find(
					config => (
						config.path === `/${group}/` ||
						config.path === '/' && group === 'highcharts'
					)
				);

				demoConfigGroup?.categories?.forEach(category => {
					const demosInCategory = [];

					for (let demo of demos) {
						const categories = [];

						let priority;
						(demo.details.categories || []).forEach(
							cat => {
								if (typeof cat === 'string') {
									categories.push(cat);
								}
								if (typeof cat === 'object') {
									categories.push.apply(
										categories,
										Object.keys(cat)
									);

									// Use priority of the first category
									priority ??= cat[category]?.priority;
								}
							}
						)
						demo.details.category ||= categories[0];

						if (categories.includes(category)) {
							demo.priority = priority || 1000;
							demosInCategory.push(demo);
						}
					}

					demosInCategory.sort((a, b) => a.priority - b.priority);

					samples.push.apply(samples, demosInCategory);

				});
			}

			samples.push.apply(samples, otherSamples);
		}
	});
	return JSON.stringify(samples, null, '  ');
};

router.get('/', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
  	res.send(getSamples());
});

export default router;
