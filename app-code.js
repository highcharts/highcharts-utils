/**
 * This is the app for code.highcharts.local
 */

const http = require('http');
const fs = require('fs');
const f = require('./lib/functions');
const { codePort } = require('./lib/arguments.js');

http.createServer(function(req, res) {

	
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');
	let url = req.url.replace(/^\/(gantt|maps|stock)\//g, '/');

	let file = f.getCodeFile(url);

	if (file.error) {
		res.end(file.error);
		return;
	}

	if (/\.js$/.test(file.success)) {
		res.setHeader('Content-Type', 'text/javascript');
	}
	res.end(fs.readFileSync(file.success));
    
}).listen(codePort);