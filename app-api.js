// Modules sorted by names alphabetically
const express = require('express');
const { apiDir, apiPort, } = require('./lib/arguments.js');

/**
 * Create express application
 */
const app = express();

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
app.listen(apiPort);