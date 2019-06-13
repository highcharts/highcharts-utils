// Modules sorted by names alphabetically
const express = require('express');
const http = require('http');
const { join, resolve } = require('path');
const { apiPort, highchartsDir } = require('./config.json');

// Constants
const apiDir = join(resolve(highchartsDir), 'build/api');

/**
 * Create express application
 */
const app = express();
app.set('port', apiPort);

// Redirect / to /highcharts
app.use('/', (req, res, next) => {
    if (req.url === '/') {
        return res.redirect(302, '/highcharts')
    }
    next();
});

// Serve content of api directory
app.use('/', express.static(apiDir, { extensions: ['html'] }));

/**
 * Create HTTP server.
 */
const server = http.createServer(app);
server.listen(apiPort);