/**
 * This is the app for code.highcharts.local
 */

// Modules sorted by names alphabetically
import express from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { crtFile, codePort, codeSecurePort, pemFile } from './lib/arguments.js';
import { getCodeFile } from './lib/functions.js';
import { startWatchServer } from './lib/websocket.js';
import { extname } from 'path';


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
	const url = req.url.replace(/^\/(gantt|maps|stock)\//g, '/');
	const { error, content, path } = await getCodeFile(url, req);

	if (error) {
		res.end(error);
		return;
	}

	if (content) {
		const type = {
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.map': 'application/json',
            '.svg': 'image/svg+xml'
        }[extname(req.path)];
        if (type) {
            res.type(type);
        }
		res.send(content);
		return;
	}

	res.sendFile(path, options);
});

/**
 * Create HTTP server.
 */
const server = http.createServer(app);
server.listen(codePort);


/**
 * Create HTTPS server.
 */
if (codeSecurePort) {
    const httpsOptions = {
        key: fs.existsSync(pemFile) && fs.readFileSync(pemFile, 'utf-8'),
        cert: fs.existsSync(crtFile) && fs.readFileSync(crtFile, 'utf-8')
    };

    if (httpsOptions.cert && httpsOptions.key) {
        https.createServer(httpsOptions, app).listen(codeSecurePort);
    }
}

// WebSocket server for codeWatch
startWatchServer(server);
