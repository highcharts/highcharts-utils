/**
 * This is the app for code.highcharts.local
 */

const fs = require('fs');
const http = require('http');
const cfg = require('./config.json');
const path = require('path');

http.createServer(function(req, res) {
	let file = path.join(
		__dirname,
		cfg.highchartsDir,
		'code',
		req.url.split('?')[0]
	);

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
    
}).listen(cfg.codePort);