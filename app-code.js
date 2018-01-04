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

	console.log('file', file);

	// Always load source
	file = file
		.replace(/\.src\.js$/, '.js')
		.replace(/\.js$/, '.src.js');

	if (!fs.existsSync(file)) {
		res.end(
    		`console.error('File doesn't exist', '${file}');`
    	);
    	return;
    }
    if (!/\.js$/.test(file)) {
    	res.end(
    		`console.error('File type not allowed', '${file}');`
    	);	
    	return;
    }

	res.end(fs.readFileSync(file));
    
}).listen(3001);