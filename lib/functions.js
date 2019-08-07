const fs = require('fs');
const yaml = require('js-yaml');
const marked = require('marked');
const branchName = require('current-git-branch');
const latestCommit = require('./latest-commit');
const { join } = require('path');
const babel = require("@babel/core");
const browserDetect = require('browser-detect');

const { highchartsDir, samplesDir, useSourceCode } = require('./arguments.js');
const jsdelivrSamplePath = /https:\/\/cdn\.jsdelivr\.net\/gh\/highcharts\/highcharts@[a-z0-9.]+\/samples\/data\//g;

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

	if (html.indexOf('.src.js') !== -1) {
		html += `
		<script>
		throw 'Do not use src.js files in demos. Use .js compiled files.';
		</script>
		`;
	}

	return html;
}

const getBranch = () => {
	return branchName(highchartsDir);
}

const getLatestCommit = () => {
	const commit = latestCommit(highchartsDir);

	return commit.commit.substr(0, 10);
}

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

const getJS = (path, req) => {
	try {
		let js = fs.readFileSync(
			join(highchartsDir, 'samples', path, 'demo.js'),
			'utf8'
		);

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
		if (
			js.indexOf('http://code.highcharts.com') !== -1 ||
			js.indexOf('http://www.highcharts.com') !== -1
		) {
			js += `
			throw 'Do not use http in demo.js. Use secure https. (${path})';
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
	file = file.split('?')[0];

	// Get the full file location
	if (file.indexOf('/lib/') === 0) {
		file = join(highchartsDir, file.replace('/lib/', '/vendor/'));

	} else {
		file = join(highchartsDir, 'code', file);

		// Always load source
		if (useSourceCode) {
			file = file
				.replace(/\.src\.js$/, '.js')
				.replace(/\.js$/, '.src.js');
		}
	}

	if (!fs.existsSync(file)) {
		return {
    		error: `console.error("File doesn't exist", "${file}");`
    	};
    }
    if (!/\.(js|css|svg)$/.test(file)) {
    	return {
    		error: `console.error("File type not allowed", "${file}");`
    	}
    }
    return {
    	success: file
    };
}

module.exports = {
	getBranch,
	getLatestCommit,
	getDetails,
	getHTML,
	getCSS,
	getJS,
	getKarmaHTML,
	getResources,
	getReadme,
	getTestNotes,
	getCodeFile
};