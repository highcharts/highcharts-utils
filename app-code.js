/**
 * This is the app for code.highcharts.local
 */

const fs = require('fs');
const http = require('http');
const highchartsDir = require('./config.json').highchartsDir;
const path = require('path');

http.createServer(function(req, res) {
	let file = path.join(
		__dirname,
		highchartsDir,
		'code',
		req.url.split('?')[0]
	);

	// Always load source
	file = file
		.replace(/\.src\.js$/, '.js')
		.replace(/\.js$/, '.src.js');

	if (fs.existsSync(file)) {
		res.end(fs.readFileSync(file));
	}
    res.end(
    	`console.error('Could not read file', '${file}');`
    );
}).listen(3001);