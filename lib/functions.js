const fs = require('fs');
const yaml = require('js-yaml');
const marked = require('marked');
const branchName = require('current-git-branch');
const latestCommit = require('./latest-commit');
const { join } = require('path');
const babel = require("@babel/core");
const browserDetect = require('browser-detect');
const https = require('https');
const moment = require('moment'); // Using dateFormat

const { highchartsDir, samplesDir, useSourceCode } = require('./arguments.js');
const jsdelivrSamplePath = /https:\/\/cdn\.jsdelivr\.net\/gh\/highcharts\/highcharts@[a-z0-9.]+\/samples\/data\//g;
const BUCKET = 'https://s3.eu-central-1.amazonaws.com/staging-vis-dev.highcharts.com';


const getJSON = async (url) => new Promise ((resolve, reject) => {
    https.get(url, (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            try {
                resolve(data)
            } catch (e) {
                reject(e);
            }
        });

    }).on("error", (err) => {
        reject(err);
    });
});

/**
 * Get demo.details in form of an object
 */
const getDetails = (path) => {
	let details;
	let detailsFile = join(samplesDir, path, 'demo.details');
	if (fs.existsSync(detailsFile)) {
		details = fs.readFileSync(detailsFile, 'utf8');
		if (details) {
			try {
				details = yaml.load(details);
			} catch (e) {
				console.error(`Error loading ${path}/demo.details:`, e.message);
			}
		}
	}
	return details || {};
}

const getKarmaHTML = () => {
	let files = require(join(highchartsDir, 'test/karma-files.json'));

	files = files.map(file => `
		<script src="/${file}"></script>
	`).join('');

	return `
		${files}
		<div id="qunit"></div>
		<div id="qunit-fixture"></div>
		<div id="container" style="width: 600px; margin 0 auto"></div>
	`
}

/**
 * Test wether a certain file should be replaced with a compiled version
 *
 * @param {string} path The file path
 * @returns {boolean} True if it should be replaced, otherwise false
 */
const shouldUseCompiled = path => (
	path.includes('.src.js')
);

/**
 * Get a list of all the src values for the script tags in an html string
 *
 * @param {string} html The html content
 * @return {Array<string>} Returns list of the src values
 */
const getScriptTagSrcValues = html => {
	const startValue = 'src="';
	const endValue = '"';
	return html
		.split('</script>')
		.filter(str => str.includes(startValue))
		.map(str => {
			const start = str.indexOf(startValue) + startValue.length;
			const end = str.indexOf(endValue, start);
			return str.substr(start, end - start);
		});
};

const getHTML = (req, codePath) => {

	let theme = req.session.theme;
	let samplePath = req.query.path;
	let file = join(highchartsDir, 'samples', samplePath, 'demo.html');
	let html = fs.existsSync(file) ?
		fs.readFileSync(file).toString() :
		`<div class="error-message"><strong>${samplePath}/demo.html</strong> does not exist in the file system.</div>`;

	if (codePath) {

		html = html.replace(
			/https:\/\/code\.highcharts\.com\/mapdata/g,
			'/mapdata'
		);

		html = html.replace(
			/https:\/\/code\.highcharts\.com\/stock/g,
			codePath
		);

		html = html.replace(
			/https:\/\/code\.highcharts\.com\/maps/g,
			codePath
		);

		html = html.replace(
			/https:\/\/code\.highcharts\.com\/gantt/g,
			codePath
		);

		html = html.replace(
			/https:\/\/code\.highcharts\.com/g,
			codePath
		);

		/*if (html.indexOf(`${codePath}/mapdata`) !== -1) {
			html = html.replace(
				RegExp(codePath + '\/mapdata', 'g'),
				'/mapdata'
			);
		}
		*/

		// Theme
		if (theme) {
			html += `
			<script src='${codePath}/themes/${theme}.js'></script>
			`;
		}
	}

	// Redirect to local data files
	html = html.replace(
		jsdelivrSamplePath,
		'/samples/data/'
	);

	// Old IE
	let safeCodePath = codePath || 'https://code.highcharts.com';
	html = `
	<!--[if lt IE 9]>
	<script src='${safeCodePath}/modules/oldie-polyfills.js'></script>
	<![endif]-->

	${html}

	<!--[if lt IE 9]>
	<script src='${safeCodePath}/modules/oldie.js'></script>
	<![endif]-->
	`;


	// Validation
	if (
		html.indexOf('http://code.highcharts.com') !== -1 ||
		html.indexOf('http://www.highcharts.com') !== -1
	) {
		html += `
		<script>
		throw 'Do not use http in demo.html. Use secure https. (${samplePath})';
		</script>
		`;
	}

	var error;
	if (html.indexOf('code.highcharts.local') !== -1) {
		error = 'Do not use <code>code.highcharts.local</code> in demo.html. Use <code>code.highcharts.com</code>';
	} else if (getScriptTagSrcValues(html).some(shouldUseCompiled)) {
		error = 'Do not use src.js files in demos. Use .js compiled files.';
	}
	if (error) {
		html += `
		<script>
		document.body.innerHTML = '<div style="text-align: center; color: red; font-size: 4em; margin-top: 30vh">${error}</div>';
		</script>
		`;
	}

	return html;
}

const getBranch = () => {
	return branchName({ altPath: highchartsDir });
}

const getLatestCommit = () => {
	const commit = latestCommit(highchartsDir);

	return commit.commit.substr(0, 10);
}

const getLatestTag = () => latestCommit(highchartsDir, true);

const getCSS = (path, codePath) => {
	const cssFile = join(highchartsDir, 'samples', path, 'demo.css');
	let css = '';

	if (fs.existsSync(cssFile)) {
		css =
			fs.readFileSync(cssFile)
			.toString();

		if (codePath) {
			css = css.replace(
				/https:\/\/code\.highcharts\.com/g,
				codePath
			);

			css = css.replace(
				/https:\/\/cdn\.rawgit\.com\/highcharts\/highcharts\/[a-z0-9\.]+\/samples\/graphics\//g,
				'/samples/graphics/'
			);
		}
	}
	return css;
}

const getJS = (path, req, es6Context) => {
	try {
        let filePath = join(highchartsDir, 'samples', path, 'demo.js');
        let es6FilePath = join(highchartsDir, 'samples', path, 'demo.mjs');

        if (!fs.existsSync(filePath) && fs.existsSync(es6FilePath)) {
            filePath = es6FilePath;
            es6Context = es6Context || {};
            es6Context.isModule = true;
        }

		let js = fs.readFileSync(filePath, 'utf8');

		// Redirect to local data files
		js = js.replace(jsdelivrSamplePath, '/samples/data/');

		// Use Babel to transform for IE
		let browser = browserDetect(req.headers['user-agent']);
		if (browser.name === 'ie') {
			let result = babel.transformSync(js, {
				ast: false,
				presets: [
					['@babel/preset-env', {
						targets: {
							ie: '8'
						}
					}]
				]
			});
			js = result.code;
		}

		// Validation
		let error;
		if (
			js.indexOf('code.highcharts.local') !== -1 ||
			js.indexOf('utils.highcharts.local') !== -1
		) {
			error = 'Do not use <code>code.highcharts.local</code> in demo.js. Use <code>code.highcharts.com</code>';
		}
		if (
			js.indexOf('http://code.highcharts.com') !== -1 ||
			js.indexOf('http://www.highcharts.com') !== -1
		) {
			error = `Do not use http in demo.js. Use secure https. (${path})`;
		}
		if (error) {
			js += `
			document.body.innerHTML += \`
				<div style="padding: 3em; background: red; color: white">
				<h1>Error</h1>
				${error}
				</div>
			\`;
			`;
		}

		return js;
	} catch (e) {
		console.error(e);
		return '';
	}
}

const getResources = (path) => {
	let details = getDetails(path);
	let resources = {
		scripts: [],
		styles: []
	}
	if (details.resources) {
		details.resources.forEach((file) => {
			if (/\.js$/.test(file)) {

				file = file
					.replace(
						'https://code.jquery.com/qunit/qunit-2.0.1.js',
						'/javascripts/vendor/qunit-2.0.1.js'
					);
				resources.scripts.push(file);

			} else if (/\.css$/.test(file)) {

				file = file
					.replace(
						'https://code.jquery.com/qunit/qunit-2.0.1.css',
						'/stylesheets/vendor/qunit-2.0.1.css'
					);

				resources.styles.push(file);
			}
		})
	}
	return resources;
}

const getReadme = (path) => {
	let file = join(highchartsDir, 'samples', path, 'readme.md');
	if (fs.existsSync(file)) {
		return marked(fs.readFileSync(file).toString());
	}
}

const getTestNotes = (path) => {
	let file = join(highchartsDir, 'samples', path, 'test-notes.md');
	if (fs.existsSync(file)) {
		return marked(fs.readFileSync(file).toString());
	}
	file = join(highchartsDir, 'samples', path, 'test-notes.html');
	if (fs.existsSync(file)) {
		return fs.readFileSync(file).toString();
	}
}

/**
 * Get the code file path or return errors on failure
 */
const getCodeFile = file => {
	const url = file.split('?')[0];
	let path;

    if (url.indexOf('/lib/') === 0) {
		path = join(highchartsDir, url.replace('/lib/', '/vendor/'));

	} else {
		path = join(highchartsDir, 'code', url);

		if (url.startsWith('/es-modules/')) {
			path = path.replace('/code/es-modules/', '/js/');
		}
		// Always load source
		if (useSourceCode && !url.startsWith('/es-modules/')) {
			path = path
				.replace(/\.src\.js$/, '.js')
				.replace(/\.js$/, '.src.js');
		}
	}

	if (!fs.existsSync(path)) {
		return {
			error: `console.error("File doesn't exist", "${path}");`
    	};
    }
    if (!/\.(js|css|svg)$/.test(path)) {
    	return {
			error: `console.error("File type not allowed", "${path}");`
    	}
    }
    return {
		success: path
    };
}


const getNightlyResult = async (date) => {
	const daysToTry = 5;

	for (let day = 0; day < daysToTry; day++) { // Try some days back
		const dateString = moment(date - day * 24 * 36e5).format('YYYY-MM-DD');
		const url = `${BUCKET}/visualtests/diffs/nightly/${dateString}/visual-test-results.json`;

		let rawJSON;
		try {
			rawJSON = await getJSON(url);

			const compare = JSON.parse(rawJSON);
			Object.keys(compare).forEach(path => {
				if (path !== 'meta') {
					compare[path] = { diff: compare[path].toString() };
				}
			});

			// Handle
			const approvalsJSON = await getJSON('https://vrevs.highsoft.com/api/reviews/latest');
			const approvals = JSON.parse(approvalsJSON);
			Object.keys(approvals.samples).forEach(path => {
				if (path !== 'meta') {
					approvals.samples[path].forEach(approval => {
						if (
							compare[path] &&
							compare[path].diff > 0 &&
							compare[path].diff.toString() === approval.diff.toString()
						) {
							compare[path].comment = {
								symbol: 'check',
								diff: approval.diff,
								title: approval.comment
							};
						}
					});
				}
			});


			return JSON.stringify(compare, null, '  ');
		} catch (e) {
			console.log(`Failed to get visual tests for ${dateString}, continuing...`);
		}
	}
	return `Failed to get results ${daysToTry} days back`;
}

module.exports = {
	getBranch,
	getDetails,
	getHTML,
	getCSS,
	getJS,
	getKarmaHTML,
	getLatestCommit,
	getLatestTag,
	getNightlyResult,
	getResources,
	getReadme,
	getTestNotes,
	getCodeFile
};