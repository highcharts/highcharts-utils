/**
 * This is the app for code.highcharts.local
 */

// Modules sorted by names alphabetically
const express = require('express');
const {
	crtFile,
	codePort,
	codeSecurePort,
	pemFile
} = require('./lib/arguments.js');
const { getCodeFile } = require('./lib/functions');

/**
 * Create express application
 */
const app = express();
const options = {
	headers: {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
	}
};

// Serve content of code directory
app.use('/', async (req, res) => {
	const url = req.url.replace(/^\/(data-grid|gantt|maps|stock)\//g, '/');
	const { error, content, path } = await getCodeFile(url, req);

	if (error) {
		res.end(error);
		return;
	}

	if (content) {
		res.type('text/javascript');
		res.send(content);
		return;
	}

	res.sendFile(path, options);
});

/**
 * Create HTTP server.
 */
app.listen(codePort);

/**
 * Create HTTPS server.
 */
if (codeSecurePort) {
    const fs = require('fs');
    const https = require('https');

    const httpsOptions = {
        key: fs.existsSync(pemFile) && fs.readFileSync(pemFile, 'utf-8'),
        cert: fs.existsSync(crtFile) && fs.readFileSync(crtFile, 'utf-8')
    };

    if (httpsOptions.cert && httpsOptions.key) {
        https.createServer(httpsOptions, app).listen(codeSecurePort);
    }
}
