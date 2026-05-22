
import express from 'express';
import * as f from './../../lib/functions.js';
import fs from 'fs';
import { join, relative, sep } from 'path';
import { samplesDir } from '../../lib/arguments.js';


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
		'demo.ts'
	].forEach(extraFile => {
		let filePath = join(samplesDir, path, extraFile);
		if (fs.existsSync(filePath)) {
			sample.files[extraFile] = true;
		}
	});

	return sample;
};

const orderLikeDemoPages = async (samples) => {

	const getCategoriesFromDemo = (demo) => {
		const categories = [];
		demo.details.categories?.forEach(cat => {
			if (typeof cat === 'string') {
				categories.push(cat);
			}
			if (typeof cat === 'object') {
				categories.push.apply(
					categories,
					Object.keys(cat)
				);
			}
		});
		return categories;
	};

	const demoConfig = await import(
		'file:///' + join(samplesDir, 'demo-config.js')
	);

	const demos = [];

	for (const demoGroup of Object.values(demoConfig.default)) {
		for (const category of demoGroup.categories || []) {
			for (const tag of demoGroup.filter.tags || []) {
				const members = samples.reduce((members, sample) => {
					if (sample.details.tags?.includes(tag)) {
						const categories = getCategoriesFromDemo(sample);
						if (categories.includes(category)) {
							sample.isDemo = true;

							let priority;
							const itemCategories = [];
							(sample.details.categories || []).forEach(
								cat => {
									if (typeof cat === 'string') {
										itemCategories.push(cat);
									}
									if (typeof cat === 'object') {
										itemCategories.push.apply(
											itemCategories,
											Object.keys(cat)
										);

										// Use priority of the current
										priority ??= cat[category]?.priority;
									}
								}
							);

							// Create a copy
							const sampleCopy = JSON.parse(JSON.stringify(sample));

							sampleCopy.priority = priority ?? 1000;
							sampleCopy.tag = tag;
							sampleCopy.category = category;
							members.push(sampleCopy);
						}
					}
					return members;
				}, []);

					console.log(tag, category, members.length);

				members.sort((a, b) => a.priority - b.priority);
				demos.push(...members);
			}
		}
	}

	// From the samples array, removed items marked isDemo
	samples = samples.filter(sample => !sample.isDemo);

	// Then unshift the demos
	demos.reverse().forEach(demo => {
		samples.unshift(demo);
	});

	return samples;


			// Order the demos as they appear in the demo pages
			/*
			if (demos.length) {
                const demoConfigGroup = Object.values(demoConfig.default).find(
					config => (
						config.path === `/${group}/` ||
						(config.path === '/' && group === 'highcharts')
					)
				);

				const uncategorized = [];

				// Get the unique list of categories from the demos
				const categories = demoConfigGroup?.categories || [];

				// Include also categories that may not be in the demoConfig
				demos.forEach(demo => {
					getCategoriesFromDemo(demo).forEach(cat => {
						if (!categories.includes(cat)) {
							categories.push(cat);
						}
					});
				});

				categories.forEach(category => {
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
						} else if (categories.length === 0) {
							// No category set, add to uncategorized
							if (!uncategorized.includes(demo)) {
								uncategorized.push(demo);
							}
						}
					}

					demosInCategory.sort((a, b) => a.priority - b.priority);

					samples.push.apply(samples, demosInCategory);

				});
				samples.push.apply(samples, uncategorized);
			}
			samples.push.apply(samples, otherSamples);
			*/

};

const getSamples = async () => {
	let samples = [];

	for (const group of [
		'highcharts',
		'react',
		'stock',
		'maps',
		'gantt',
		'unit-tests',
		'issues',
		'cloud',
		'dashboards',
		'grid-lite',
		'grid-pro'
	]) {
		const groupDir = join(samplesDir, group);
		if (fs.existsSync(groupDir) && fs.lstatSync(groupDir).isDirectory()) {
			const subgroups = fs.readdirSync(groupDir);

			// Move the 'demo' subgroup to the start of the list
			const demoIndex = subgroups.indexOf('demo');
			if (demoIndex > -1) {
				subgroups.unshift(subgroups.splice(demoIndex, 1)[0]);
			}

			subgroups.forEach(subgroup => {
				const subgroupDir = join(groupDir, subgroup);
				if (fs.lstatSync(subgroupDir).isDirectory()) {
					fs.readdirSync(subgroupDir).forEach(sample => {
						let path = join(subgroupDir, sample);
						if (
							fs.lstatSync(path).isDirectory() &&
							(
								fs.existsSync(join(path, 'demo.html')) ||
								fs.existsSync(join(path, 'config.ts'))
							)
						) {
							const relativePath = relative(samplesDir, path)
								.split(sep).join('/');

							samples.push(getSample(relativePath));
						}
					});
				}
			});
		}
	}

	samples = await orderLikeDemoPages(samples);

	return JSON.stringify(samples, null, '  ');
};

router.get('/', async function(req, res) {
	res.setHeader('Content-Type', 'application/json');
  	res.send(await getSamples());
});

export default router;
