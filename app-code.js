/**
 * This is the app for code.highcharts.local
 */

const http = require('http');
const fs = require('fs');
const f = require('./lib/functions');
const cfg = require('./config.json');

http.createServer(function(req, res) {
	let file = f.getCodeFile(req.url);

	if (file.error) {
		res.end(file.error);
		return;
	}

	res.end(fs.readFileSync(file.success));
    
}).listen(cfg.codePort);