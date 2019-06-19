/**
 * This is the app for code.highcharts.local
 */

const http = require('http');
const fs = require('fs');
const f = require('./lib/functions');
const { codePort } = require('./lib/arguments.js');

http.createServer(function(req, res) {

	let url = req.url.replace(/^\/(gantt|maps|stock)\//g, '/');

	let file = f.getCodeFile(url);

	if (file.error) {
		res.end(file.error);
		return;
	}

	res.end(fs.readFileSync(file.success));
    
}).listen(codePort);